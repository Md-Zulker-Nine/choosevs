import fs from 'node:fs/promises';
import path from 'node:path';
import Handlebars from 'handlebars';
import {
  AI_CONFIG,
  CATEGORY_SLUGS,
  GENERATION_CONFIG,
  PATHS,
  QUALITY_CONFIG,
  getApiKey,
  type CategorySlug,
} from './config';
import { getKeywords, type Keyword } from './keywords';
import {
  assessQuality,
  validateGeneratedPost,
  type GeneratedPost,
  type QualityReport,
} from './validate';

const CATEGORY_NAMES: Record<CategorySlug, string> = {
  tech: 'Technology',
  movies: 'Movies & TV',
  countries: 'Countries',
  cars: 'Cars & Vehicles',
  travel: 'Travel & Destinations',
  crypto: 'Cryptocurrency',
  'ai-models': 'AI Models',
};

interface CliOptions {
  count: number;
  category?: CategorySlug;
  maxDifficulty?: number;
  dryRun: boolean;
  force: boolean;
  outputDir: string;
  minWords?: number;
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

  const rawDifficulty = get('max-difficulty');
  const rawMinWords = get('min-words');

  return {
    count,
    category: rawCategory as CategorySlug | undefined,
    maxDifficulty: rawDifficulty ? Number.parseInt(rawDifficulty, 10) : undefined,
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    outputDir: get('out') ? path.resolve(get('out') as string) : PATHS.outputDir,
    minWords: rawMinWords ? Number.parseInt(rawMinWords, 10) : undefined,
  };
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function readTimeFor(wordCount: number): string {
  return `${Math.max(1, Math.round(wordCount / GENERATION_CONFIG.wordsPerMinute))} min read`;
}

function escapeYaml(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function loadTemplate(): Promise<HandlebarsTemplateDelegate> {
  const source = await fs.readFile(PATHS.postTemplate, 'utf8');
  return Handlebars.compile(source, { noEscape: true });
}

function buildPrompt(template: HandlebarsTemplateDelegate, keyword: Keyword, minWords?: number): string {
  return template({
    site: { name: 'ChooseVS', url: 'https://choosevs.com' },
    keyword: keyword.keyword,
    category: keyword.category,
    categoryName: CATEGORY_NAMES[keyword.category],
    difficulty: keyword.difficulty,
    searchVolume: keyword.searchVolume.toLocaleString('en-US'),
    suggestedSlug: slugify(keyword.keyword),
    date: todayIso(),
    year: new Date().getFullYear(),
    minWords: minWords || QUALITY_CONFIG.minWords,
    maxWords: QUALITY_CONFIG.maxWords,
    minH2Sections: QUALITY_CONFIG.minH2Sections,
    minFaqItems: QUALITY_CONFIG.minFaqItems,
    maxFaqItems: QUALITY_CONFIG.maxFaqItems,
    minKeywordDensity: QUALITY_CONFIG.minKeywordDensity,
    maxKeywordDensity: QUALITY_CONFIG.maxKeywordDensity,
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
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Continue to recovery
  }

  // Fix common issues: unescaped newlines in strings, trailing commas
  let fixed = text;

  // Replace literal newlines inside strings with escaped newlines
  fixed = fixed.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
  fixed = fixed.replace(/(?<=:\s*"[^"]*)\r\n(?=[^"]*")/g, '\\n');

  // Remove trailing commas before closing brackets
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(fixed);
  } catch {
    // Continue to more aggressive recovery
  }

  // Try to find the largest valid JSON object
  for (let i = fixed.length; i > 0; i--) {
    try {
      const parsed = JSON.parse(fixed.slice(0, i));
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch {
      // Continue searching
    }
  }

  // Try adding closing braces/brackets
  for (const suffix of ['"}', '"}', '}', '"]}', ']}', '"}]}}', '"}]}']) {
    try {
      return JSON.parse(fixed + suffix);
    } catch {
      // Continue
    }
  }

  throw new Error('Unable to parse JSON response');
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

function renderMdx(post: GeneratedPost, keyword: Keyword, report: QualityReport): string {
  const date = todayIso();
  const frontmatter = [
    '---',
    `title: ${escapeYaml(post.title)}`,
    `description: ${escapeYaml(post.description)}`,
    `slug: ${escapeYaml(post.slug)}`,
    `date: ${escapeYaml(date)}`,
    `category: ${escapeYaml(post.category)}`,
    `keyword: ${escapeYaml(keyword.keyword)}`,
    'tags:',
    ...post.tags.map((t) => `  - ${escapeYaml(t)}`),
    `image: ${escapeYaml(GENERATION_CONFIG.defaultImage)}`,
    `author: ${escapeYaml(GENERATION_CONFIG.defaultAuthor)}`,
    `readTime: ${escapeYaml(readTimeFor(report.metrics.wordCount))}`,
    'layout: ../../layouts/BaseLayout.astro',
    '---',
  ].join('\n');

  const takeaways = post.keyTakeaways.map((t) => `- ${t}`).join('\n');
  const faq = post.faq.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n');

  return `${frontmatter}

import ShareButtons from '../../components/ShareButtons.astro';

## Key Takeaways

${takeaways}

${post.content.trim()}

## Frequently Asked Questions

${faq}

<ShareButtons title={frontmatter.title} slug={frontmatter.slug} />
`;
}

async function generateOne(
  template: HandlebarsTemplateDelegate,
  keyword: Keyword,
  options: CliOptions
): Promise<{ slug: string; status: 'written' | 'skipped' | 'rejected' | 'failed'; detail: string }> {
  const slug = slugify(keyword.keyword);
  const outFile = path.join(options.outputDir, `${slug}.mdx`);

  if (!options.force && GENERATION_CONFIG.skipExisting) {
    const exists = await fs
      .access(outFile)
      .then(() => true)
      .catch(() => false);
    if (exists) return { slug, status: 'skipped', detail: 'file already exists' };
  }

  const prompt = buildPrompt(template, keyword, options.minWords);

  if (options.dryRun) {
    return { slug, status: 'skipped', detail: `dry run (prompt ${prompt.length} chars)` };
  }

  let raw: unknown;
  try {
    const text = stripCodeFence(await callGemini(prompt));
    raw = parseRobustJson(text);
  } catch (error) {
    return {
      slug,
      status: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  const validated = validateGeneratedPost(raw);
  let postData = validated.ok ? validated.data : null;

  // If validation failed, try to fix/fill missing fields
  if (!postData && raw && typeof raw === 'object') {
    const rawObj = raw as Record<string, unknown>;
    postData = {
      title: (rawObj.title as string) || `${keyword.keyword} - Complete Guide`,
      description: (rawObj.description as string) || `Comprehensive guide about ${keyword.keyword}.`,
      slug: slugify(keyword.keyword),
      category: (CATEGORY_SLUGS.includes(rawObj.category as string) ? rawObj.category : 'tech') as any,
      tags: Array.isArray(rawObj.tags) ? rawObj.tags as string[] : [keyword.keyword, 'guide', 'comparison', 'review'],
      content: (rawObj.content as string) || (rawObj.body as string) || (rawObj.article as string) || '',
      faq: Array.isArray(rawObj.faq) ? rawObj.faq as any[] : [],
      keyTakeaways: Array.isArray(rawObj.keyTakeaways) ? rawObj.keyTakeaways as string[] : [],
    };
  }

  if (!postData || !postData.content || postData.content.length < 100) {
    return { slug, status: 'rejected', detail: `schema: insufficient content (${postData?.content?.length || 0} chars)` };
  }

  // Ensure FAQ and keyTakeaways exist
  if (!postData.faq || postData.faq.length === 0) {
    postData.faq = [
      { question: `What is ${keyword.keyword}?`, answer: `${keyword.keyword} is a popular topic. This guide covers everything you need to know.` },
      { question: `Why should I care about ${keyword.keyword}?`, answer: `Understanding ${keyword.keyword} helps you make informed decisions.` },
    ];
  }
  if (!postData.keyTakeaways || postData.keyTakeaways.length === 0) {
    postData.keyTakeaways = [
      `${keyword.keyword} offers great value for users.`,
      `Consider your specific needs before choosing.`,
      `Compare multiple options before making a decision.`,
    ];
  }

  const report = assessQuality({
    slug,
    keyword: keyword.keyword,
    content: postData.content,
    faqCount: postData.faq.length,
  });

  await fs.mkdir(options.outputDir, { recursive: true });
  await fs.writeFile(outFile, renderMdx(postData, keyword, report), 'utf8');

  return {
    slug,
    status: 'written',
    detail: `score ${report.score}/100, ${report.metrics.wordCount} words`,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const keywords = getKeywords({
    count: options.count,
    category: options.category,
    maxDifficulty: options.maxDifficulty,
  });

  if (keywords.length === 0) {
    console.log('No keywords matched the given filters.');
    return;
  }

  console.log(
    `Generating ${keywords.length} post(s) with ${AI_CONFIG.models.join(', ')} → ${path.relative(process.cwd(), options.outputDir)}${options.dryRun ? ' (dry run)' : ''}`
  );

  const template = await loadTemplate();
  const results: Array<Awaited<ReturnType<typeof generateOne>>> = [];

  for (const [index, keyword] of keywords.entries()) {
    process.stdout.write(`  [${index + 1}/${keywords.length}] ${keyword.keyword} ... `);
    const result = await generateOne(template, keyword, options);
    results.push(result);
    console.log(`${result.status} (${result.detail})`);

    if (index < keywords.length - 1) {
      await sleep(GENERATION_CONFIG.delayBetweenPostsMs);
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
