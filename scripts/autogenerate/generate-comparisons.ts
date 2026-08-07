import fs from 'node:fs/promises';
import path from 'node:path';
import Handlebars from 'handlebars';
import {
  AI_CONFIG,
  CATEGORIES,
  CATEGORY_SLUGS,
  GENERATION_CONFIG,
  LOWER_IS_BETTER_SPECS,
  PATHS,
  QUALITY_CONFIG,
  getApiKey,
  type CategorySlug,
} from './config';
import { findRelatedPairs, generatePairs, type Pair } from './pairs';
import {
  assessQuality,
  validateGeneratedComparison,
  type Entity,
  type GeneratedComparison,
  type QualityReport,
  type SpecRow,
} from './validate';

interface CliOptions {
  count: number;
  category?: CategorySlug;
  minPriority?: number;
  dryRun: boolean;
  force: boolean;
  offline: boolean;
  outputDir: string;
}

function parseArgs(argv: string[]): CliOptions {
  const get = (name: string): string | undefined => {
    const eq = argv.find((a) => a.startsWith(`--${name}=`));
    if (eq) return eq.split('=').slice(1).join('=');
    const idx = argv.indexOf(`--${name}`);
    if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) return argv[idx + 1];
    return undefined;
  };

  const rawCount = get('count');
  const count = rawCount ? Number.parseInt(rawCount, 10) : GENERATION_CONFIG.batchSize;
  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`Invalid --count value: ${rawCount}`);
  }
  if (count > GENERATION_CONFIG.maxBatchSize) {
    throw new Error(`--count ${count} exceeds maxBatchSize ${GENERATION_CONFIG.maxBatchSize}`);
  }

  const rawCategory = get('category');
  if (rawCategory && !CATEGORY_SLUGS.includes(rawCategory as CategorySlug)) {
    throw new Error(`Unknown --category "${rawCategory}". Valid: ${CATEGORY_SLUGS.join(', ')}`);
  }

  const rawMinPriority = get('min-priority');

  return {
    count,
    category: rawCategory as CategorySlug | undefined,
    minPriority: rawMinPriority ? Number.parseInt(rawMinPriority, 10) : undefined,
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    offline: argv.includes('--offline'),
    outputDir: get('out') ? path.resolve(get('out') as string) : PATHS.outputDir,
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function escapeYaml(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadTemplate(): Promise<HandlebarsTemplateDelegate> {
  const source = await fs.readFile(PATHS.comparisonTemplate, 'utf8');
  return Handlebars.compile(source, { noEscape: true });
}

function buildPrompt(template: HandlebarsTemplateDelegate, pair: Pair): string {
  const category = CATEGORIES[pair.category];

  return template({
    site: { name: 'ChooseVS', url: 'https://choosevs.com' },
    category: pair.category,
    categoryName: category.name,
    specLabels: Object.values(category.specLabels).join(', '),
    entityA: { ...pair.a, specList: Object.entries(pair.a.specs).map(([k, v]) => ({ key: k, value: v })) },
    entityB: { ...pair.b, specList: Object.entries(pair.b.specs).map(([k, v]) => ({ key: k, value: v })) },
    year: new Date().getFullYear(),
    minWords: QUALITY_CONFIG.minWords,
    maxWords: QUALITY_CONFIG.maxWords,
    minH2Sections: QUALITY_CONFIG.minH2Sections,
    minSpecRows: QUALITY_CONFIG.minSpecRows,
    maxSpecRows: QUALITY_CONFIG.maxSpecRows,
    minPros: QUALITY_CONFIG.minProsPerEntity,
    maxPros: QUALITY_CONFIG.maxProsPerEntity,
    minCons: QUALITY_CONFIG.minConsPerEntity,
    maxCons: QUALITY_CONFIG.maxConsPerEntity,
    minFaqItems: QUALITY_CONFIG.minFaqItems,
    maxFaqItems: QUALITY_CONFIG.maxFaqItems,
    maxTiePercent: Math.round(QUALITY_CONFIG.maxTieRatio * 100),
    minTitleLength: QUALITY_CONFIG.minTitleLength,
    maxTitleLength: QUALITY_CONFIG.maxTitleLength,
    minDescriptionLength: QUALITY_CONFIG.minDescriptionLength,
    maxDescriptionLength: QUALITY_CONFIG.maxDescriptionLength,
  });
}

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  return start !== -1 && end > start ? body.slice(start, end + 1) : body.trim();
}

// Parse JSON with recovery for truncated/malformed responses
function parseRobustJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Continue to recovery
  }
  let fixed = text;
  fixed = fixed.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
  fixed = fixed.replace(/(?<=:\s*"[^"]*)\r\n(?=[^"]*")/g, '\\n');
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(fixed);
  } catch {
    // Continue
  }
  for (let i = fixed.length; i > 0; i--) {
    try {
      const parsed = JSON.parse(fixed.slice(0, i));
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch {
      // Continue
    }
  }
  for (const suffix of ['"}', '"}', '}', '"]}', ']}', '"}]}}', '"}]}']) {
    try {
      return JSON.parse(fixed + suffix);
    } catch {
      // Continue
    }
  }
  throw new Error('Unable to parse JSON response');
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  let lastError: unknown;

  // Try each model in order
  for (const model of AI_CONFIG.models) {
    const url = `${AI_CONFIG.apiBaseUrl}/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 1; attempt <= AI_CONFIG.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: AI_CONFIG.temperature,
              topP: AI_CONFIG.topP,
              topK: AI_CONFIG.topK,
              maxOutputTokens: AI_CONFIG.maxTokens,
              responseMimeType: AI_CONFIG.responseMimeType,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Gemini API ${response.status}: ${await response.text()}`);
        }

        const payload = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        if (!text.trim()) throw new Error('Gemini returned an empty response');

        return text;
      } catch (error) {
        lastError = error;
        if (attempt < AI_CONFIG.maxRetries) {
          await sleep(AI_CONFIG.retryDelayMs * attempt);
        }
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function sharedSpecKeys(a: Entity, b: Entity, category: CategorySlug): string[] {
  const labels = CATEGORIES[category].specLabels;
  const ordered = Object.keys(labels).filter((key) => key in a.specs && key in b.specs);
  const extras = Object.keys(a.specs).filter((key) => key in b.specs && !ordered.includes(key));
  return [...ordered, ...extras];
}

function specLabelFor(category: CategorySlug, key: string): string {
  return (
    CATEGORIES[category].specLabels[key] ??
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()
  );
}

function dedupeTags(candidates: string[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const candidate of candidates) {
    const tag = candidate.trim().toLowerCase().replace(/\s+/g, ' ');
    if (tag.length < 2 || tag.length > 40 || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }

  return tags.slice(0, 8);
}

function firstNumber(value: string): number | null {
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function pickWinner(key: string, a: Entity, b: Entity): SpecRow['winner'] {
  const valueA = a.specs[key];
  const valueB = b.specs[key];
  if (valueA === valueB) return 'tie';

  const numA = firstNumber(valueA);
  const numB = firstNumber(valueB);
  if (numA === null || numB === null || numA === numB) return 'tie';

  const lowerWins = LOWER_IS_BETTER_SPECS.has(key);
  return (lowerWins ? numA < numB : numA > numB) ? 'a' : 'b';
}

function buildOfflineComparison(pair: Pair): GeneratedComparison {
  const { a, b, category } = pair;
  const categoryName = CATEGORIES[category].name;

  const specs: SpecRow[] = sharedSpecKeys(a, b, category)
    .slice(0, QUALITY_CONFIG.maxSpecRows)
    .map((key) => ({
      label: specLabelFor(category, key),
      valueA: a.specs[key],
      valueB: b.specs[key],
      winner: pickWinner(key, a, b),
    }));

  const aWins = specs.filter((s) => s.winner === 'a').length;
  const bWins = specs.filter((s) => s.winner === 'b').length;

  const scoreLead: SpecRow['winner'] =
    Math.abs(a.score - b.score) < 0.2 ? 'tie' : a.score > b.score ? 'a' : 'b';
  const specLead: SpecRow['winner'] = aWins === bWins ? 'tie' : aWins > bWins ? 'a' : 'b';
  const winner: SpecRow['winner'] =
    scoreLead === 'tie' || specLead === 'tie' || scoreLead === specLead ? scoreLead : 'tie';

  const decisiveLabels = specs
    .filter((s) => s.winner !== 'tie')
    .slice(0, 3)
    .map((s) => s.label.toLowerCase());
  const topDifferences =
    decisiveLabels.length > 1
      ? `${decisiveLabels.slice(0, -1).join(', ')} and ${decisiveLabels[decisiveLabels.length - 1]}`
      : (decisiveLabels[0] ?? 'a handful of secondary specs');

  const side = (entity: Entity, other: Entity) => ({
    score: entity.score,
    pros: [
      `${entity.tagline} — a clear focus that shows up in daily use`,
      `Backed by ${entity.brand} and the support that comes with the brand`,
      `Released in ${entity.releaseYear}, so the platform is still current`,
      `Rated ${entity.score}/10 by our editors against the wider ${categoryName} field`,
    ],
    cons: [
      `Overlaps heavily with the ${other.name}, so the choice comes down to details`,
      `Pricing leaves little margin for error if your needs change`,
      `Not the right pick if you need what the ${other.name} specialises in`,
    ],
    bestFor: `Buyers who want what ${entity.brand} does best and value ${entity.tagline.toLowerCase()} above the alternatives.`,
  });

  const content = [
    '## Overview',
    '',
    `The ${a.name} and the ${b.name} sit in the same part of the ${categoryName.toLowerCase()} market, which is exactly why they end up on the same shortlist. Both target buyers who want a serious option rather than an entry-level compromise, and both are priced to be considered against each other.`,
    '',
    `The differences between them are real but narrow. ${a.brand} and ${b.brand} have made different calls about where to spend the budget, and those calls should drive your decision rather than brand loyalty or marketing.`,
    '',
    `## ${a.name} at a Glance`,
    '',
    `The ${a.name} is ${a.tagline.toLowerCase()}. It arrived in ${a.releaseYear} and earns ${a.score}/10 from our team. What stands out is how consistently it performs across the categories most buyers rank highest, rather than winning any single spec by a dramatic margin. Across the table above it takes ${aWins} of ${specs.length} categories.`,
    '',
    `## ${b.name} at a Glance`,
    '',
    `The ${b.name} takes a different route: ${b.tagline.toLowerCase()}. Launched in ${b.releaseYear} with a ${b.score}/10 score, it makes a stronger case in the areas ${b.brand} has traditionally prioritised. It wins ${bWins} of the ${specs.length} categories we measured, and those wins cluster around its core strengths.`,
    '',
    '## Head-to-Head',
    '',
    '### Core Performance',
    '',
    `The spec table puts the ${a.name} ahead in ${aWins} categories and the ${b.name} ahead in ${bWins}. Look closely at which rows those wins land on, because a win in a category you never touch is worth nothing to you in practice.`,
    '',
    '### Value for Money',
    '',
    'Price is the row that changes most often and matters most at the point of purchase. Work out the cost per capability you will actually use rather than comparing sticker prices in isolation, and factor in how long you plan to keep it.',
    '',
    '### Day-to-Day Experience',
    '',
    `Specs describe capability; the daily experience is about fit. The ${a.name} suits people who want ${a.tagline.toLowerCase()}, while the ${b.name} rewards people who want ${b.tagline.toLowerCase()}. Neither approach is wrong, but one of them will match your routine better.`,
    '',
    '### Longevity',
    '',
    `Both ${a.brand} and ${b.brand} support their products well past the first year. The newer of the two — released in ${Math.max(a.releaseYear, b.releaseYear)} — has a longer runway before it starts to feel dated, which matters if you keep things for four years or more. Resale value tends to track brand reputation as much as raw specification, so factor that in if you upgrade on a regular cycle rather than running hardware into the ground.`,
    '',
    '### Where They Diverge Most',
    '',
    `The largest gaps between these two show up in ${topDifferences}. Those are the rows worth re-reading, because everything else in the table is close enough that it will not change how either one feels in use. If none of those categories matter to you, treat the two as functionally equivalent and let price decide.`,
    '',
    '## Who Should Buy Which',
    '',
    `Buy the ${a.name} if you want ${a.tagline.toLowerCase()} and you expect to lean on the categories where it wins. It is the safer pick for anyone already invested in what ${a.brand} offers, and the ${a.score}/10 score reflects a product with no serious weak points rather than one that dominates a single category.`,
    '',
    `Buy the ${b.name} if ${b.tagline.toLowerCase()} describes your use case more accurately, or if its pricing puts your money where you actually need it. At ${b.score}/10 it trades a little breadth for a sharper focus, and for the right buyer that focus is worth more than a marginally higher overall score.`,
    '',
    `If both descriptions fit you equally well, buy whichever is cheaper at the time you are ready. Neither of these is a mistake, and the money saved is worth more than the difference between them.`,
  ].join('\n');

  return {
    title: `${a.name} vs ${b.name}: Which Should You Buy?`.slice(0, QUALITY_CONFIG.maxTitleLength),
    description: `A spec-by-spec comparison of the ${a.name} and ${b.name}, covering value, performance and who each one actually suits.`.slice(
      0,
      QUALITY_CONFIG.maxDescriptionLength
    ),
    tags: dedupeTags([
      `${a.name} vs ${b.name}`,
      a.name,
      b.name,
      `${a.brand} vs ${b.brand}`,
      categoryName,
      `best ${a.subcategory.replace(/-/g, ' ')}`,
      `${a.subcategory.replace(/-/g, ' ')} comparison`,
      `${a.brand} vs ${b.brand} ${new Date().getFullYear()}`,
    ]),
    entityA: side(a, b),
    entityB: side(b, a),
    specs,
    verdict: {
      winner,
      summary: `Across ${specs.length} measured categories the ${a.name} takes ${aWins} and the ${b.name} takes ${bWins}. ${winner === 'tie' ? 'The two finish close enough that the decision comes down to which strengths you actually use.' : `That puts the ${winner === 'a' ? a.name : b.name} ahead overall, though not by a margin that makes the other a bad buy.`}`,
      recommendation: `Choose the ${a.name} if ${a.tagline.toLowerCase()} matches how you will use it day to day. Choose the ${b.name} if ${b.tagline.toLowerCase()} is closer to your priorities and your budget.`,
    },
    faq: [
      {
        question: `Is the ${a.name} better than the ${b.name}?`,
        answer: `On our scoring the ${a.name} rates ${a.score}/10 and the ${b.name} rates ${b.score}/10. The ${a.name} wins ${aWins} of ${specs.length} spec categories and the ${b.name} wins ${bWins}, so the real gap is smaller than the headline scores suggest.`,
      },
      {
        question: `What is the main difference between the ${a.name} and the ${b.name}?`,
        answer: `The ${a.name} is built around ${a.tagline.toLowerCase()}, while the ${b.name} leans into ${b.tagline.toLowerCase()}. That difference in priorities shows up across the whole spec table rather than in any single number.`,
      },
      {
        question: 'Which one is better value for money?',
        answer: `Compare the price rows against the categories you actually care about. Paying more only makes sense when the extra spend lands on specs you will use every day, and both of these are priced close enough that the answer depends on your use case.`,
      },
    ],
    content,
  };
}

function renderMdx(
  pair: Pair,
  generated: GeneratedComparison,
  related: Pair[],
  source: string
): string {
  const indent = (lines: string[], spaces: number) =>
    lines.map((line) => `${' '.repeat(spaces)}${line}`);

  const sideYaml = (key: 'entityA' | 'entityB', entity: Pair['a']) => {
    const data = generated[key];
    return [
      `${key}:`,
      ...indent(
        [
          `id: ${escapeYaml(entity.id)}`,
          `name: ${escapeYaml(entity.name)}`,
          `tagline: ${escapeYaml(entity.tagline)}`,
          `emoji: ${escapeYaml(entity.emoji)}`,
          `score: ${data.score}`,
          'pros:',
          ...indent(data.pros.map((p) => `- ${escapeYaml(p)}`), 2),
          'cons:',
          ...indent(data.cons.map((c) => `- ${escapeYaml(c)}`), 2),
          `bestFor: ${escapeYaml(data.bestFor)}`,
        ],
        2
      ),
    ];
  };

  const frontmatter = [
    '---',
    `title: ${escapeYaml(generated.title)}`,
    `description: ${escapeYaml(generated.description)}`,
    `slug: ${escapeYaml(pair.slug)}`,
    `date: ${escapeYaml(todayIso())}`,
    `updated: ${escapeYaml(todayIso())}`,
    `category: ${escapeYaml(pair.category)}`,
    `categoryName: ${escapeYaml(CATEGORIES[pair.category].name)}`,
    'tags:',
    ...indent(generated.tags.map((t) => `- ${escapeYaml(t)}`), 2),
    `image: ${escapeYaml(GENERATION_CONFIG.defaultImage)}`,
    `author: ${escapeYaml(GENERATION_CONFIG.defaultAuthor)}`,
    `generatedBy: ${escapeYaml(source)}`,
    ...sideYaml('entityA', pair.a),
    ...sideYaml('entityB', pair.b),
    'specs:',
    ...generated.specs.flatMap((spec) => [
      `  - label: ${escapeYaml(spec.label)}`,
      `    valueA: ${escapeYaml(spec.valueA)}`,
      `    valueB: ${escapeYaml(spec.valueB)}`,
      `    winner: ${escapeYaml(spec.winner)}`,
    ]),
    'verdict:',
    `  winner: ${escapeYaml(generated.verdict.winner)}`,
    `  summary: ${escapeYaml(generated.verdict.summary)}`,
    `  recommendation: ${escapeYaml(generated.verdict.recommendation)}`,
    'faq:',
    ...generated.faq.flatMap((item) => [
      `  - question: ${escapeYaml(item.question)}`,
      `    answer: ${escapeYaml(item.answer)}`,
    ]),
    related.length > 0 ? 'related:' : 'related: []',
    ...related.flatMap((r) => [
      `  - slug: ${escapeYaml(r.slug)}`,
      `    title: ${escapeYaml(`${r.a.name} vs ${r.b.name}`)}`,
    ]),
    'layout: ../../layouts/BaseLayout.astro',
    '---',
  ].join('\n');

  const specTable = [
    `| Specification | ${pair.a.name} | ${pair.b.name} | Winner |`,
    '| --- | --- | --- | --- |',
    ...generated.specs.map((s) => {
      const label =
        s.winner === 'a' ? pair.a.name : s.winner === 'b' ? pair.b.name : 'Tie';
      return `| ${s.label} | ${s.valueA} | ${s.valueB} | ${label} |`;
    }),
  ].join('\n');

  const prosCons = [
    `### ${pair.a.name}`,
    '',
    '**Pros**',
    '',
    ...generated.entityA.pros.map((p) => `- ${p}`),
    '',
    '**Cons**',
    '',
    ...generated.entityA.cons.map((c) => `- ${c}`),
    '',
    `**Best for:** ${generated.entityA.bestFor}`,
    '',
    `### ${pair.b.name}`,
    '',
    '**Pros**',
    '',
    ...generated.entityB.pros.map((p) => `- ${p}`),
    '',
    '**Cons**',
    '',
    ...generated.entityB.cons.map((c) => `- ${c}`),
    '',
    `**Best for:** ${generated.entityB.bestFor}`,
  ].join('\n');

  const verdictName =
    generated.verdict.winner === 'a'
      ? pair.a.name
      : generated.verdict.winner === 'b'
        ? pair.b.name
        : 'It depends on your needs';

  const faq = generated.faq.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n');

  const relatedLinks =
    related.length > 0
      ? [
          '## Related Comparisons',
          '',
          ...related.map((r) => `- [${r.a.name} vs ${r.b.name}](/compare/${r.slug})`),
        ].join('\n')
      : '';

  return `${frontmatter}

${generated.content.trim()}

## Specs Compared

${specTable}

## Pros and Cons

${prosCons}

## The Verdict

**Winner: ${verdictName}**

${generated.verdict.summary}

${generated.verdict.recommendation}

## Frequently Asked Questions

${faq}

${relatedLinks}
`;
}

async function generateOne(
  template: HandlebarsTemplateDelegate,
  pair: Pair,
  related: Pair[],
  options: CliOptions
): Promise<{ slug: string; status: 'written' | 'skipped' | 'rejected' | 'failed'; detail: string }> {
  const outFile = path.join(options.outputDir, `${pair.slug}.mdx`);

  if (!options.force && GENERATION_CONFIG.skipExisting) {
    const exists = await fs
      .access(outFile)
      .then(() => true)
      .catch(() => false);
    if (exists) return { slug: pair.slug, status: 'skipped', detail: 'file already exists' };
  }

  let generated: GeneratedComparison;
  let source: string;

  if (options.offline) {
    generated = buildOfflineComparison(pair);
    source = 'choosevs-autogenerate/offline';
  } else {
    const prompt = buildPrompt(template, pair);

    if (options.dryRun) {
      return { slug: pair.slug, status: 'skipped', detail: `dry run (prompt ${prompt.length} chars)` };
    }

    let raw: unknown;
    try {
      raw = parseRobustJson(stripCodeFence(await callGemini(prompt)));
    } catch (error) {
      return {
        slug: pair.slug,
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      };
    }

    const validated = validateGeneratedComparison(raw);
    if (!validated.ok) {
      return { slug: pair.slug, status: 'rejected', detail: `schema: ${validated.errors.join('; ')}` };
    }

    generated = validated.data;
    source = `choosevs-autogenerate/${AI_CONFIG.model}`;
  }

  if (options.dryRun) {
    return { slug: pair.slug, status: 'skipped', detail: 'dry run' };
  }

  const report: QualityReport = assessQuality({
    slug: pair.slug,
    content: generated.content,
    specs: generated.specs,
    verdict: generated.verdict,
    faqCount: generated.faq.length,
    entityA: { name: pair.a.name, ...generated.entityA },
    entityB: { name: pair.b.name, ...generated.entityB },
  });

  if (!report.passed && !options.force) {
    return {
      slug: pair.slug,
      status: 'rejected',
      detail: `quality ${report.score}/100 — ${report.errors.join('; ') || 'below threshold'}`,
    };
  }

  await fs.mkdir(options.outputDir, { recursive: true });
  await fs.writeFile(outFile, renderMdx(pair, generated, related, source), 'utf8');

  return {
    slug: pair.slug,
    status: 'written',
    detail: `score ${report.score}/100, ${report.metrics.wordCount} words, ${report.metrics.specCount} specs`,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const allPairs = generatePairs({
    category: options.category,
    minPriority: options.minPriority,
  });

  const queue = allPairs.slice(0, options.count);

  if (queue.length === 0) {
    console.log('No entity pairs matched the given filters.');
    return;
  }

  console.log(
    `Generating ${queue.length} comparison(s) of ${allPairs.length} candidates with ${options.offline ? 'offline templates' : AI_CONFIG.model} → ${path.relative(process.cwd(), options.outputDir)}${options.dryRun ? ' (dry run)' : ''}`
  );

  const template = await loadTemplate();
  const results: Array<Awaited<ReturnType<typeof generateOne>>> = [];

  for (const [index, pair] of queue.entries()) {
    process.stdout.write(`  [${index + 1}/${queue.length}] ${pair.slug} ... `);
    const related = findRelatedPairs(pair, allPairs, GENERATION_CONFIG.relatedCount);
    const result = await generateOne(template, pair, related, options);
    results.push(result);
    console.log(`${result.status} (${result.detail})`);

    if (index < queue.length - 1 && !options.offline && !options.dryRun) {
      await sleep(GENERATION_CONFIG.delayBetweenPagesMs);
    }
  }

  const tally = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    `\nDone: ${tally.written ?? 0} written, ${tally.skipped ?? 0} skipped, ${tally.rejected ?? 0} rejected, ${tally.failed ?? 0} failed.`
  );

  if ((tally.failed ?? 0) > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
