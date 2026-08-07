import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import matter from 'gray-matter';
import { CATEGORY_SLUGS, PATHS, QUALITY_CONFIG } from './config';

const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAIR_SLUG_RE = /^[a-z0-9-]+-vs-[a-z0-9-]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const entitySchema = z.object({
  id: z.string().regex(KEBAB_RE, 'entity id must be kebab-case'),
  name: z.string().min(2).max(60),
  brand: z.string().min(1).max(40),
  category: z.enum(CATEGORY_SLUGS),
  subcategory: z.string().min(2).max(40),
  tagline: z.string().min(8).max(120),
  emoji: z.string().min(1).max(8),
  tier: z.number().int().min(1).max(5),
  searchVolume: z.number().int().nonnegative(),
  releaseYear: z.number().int().min(1900).max(2100),
  score: z.number().min(0).max(10),
  specs: z
    .record(z.string(), z.string().min(1))
    .refine((s) => Object.keys(s).length >= 5, { message: 'entity needs at least 5 specs' }),
});

export const winnerSchema = z.enum(['a', 'b', 'tie']);

export const specRowSchema = z.object({
  label: z.string().min(2).max(60),
  valueA: z.string().min(1).max(200),
  valueB: z.string().min(1).max(200),
  winner: winnerSchema,
});

export const sideSchema = z.object({
  id: z.string().regex(KEBAB_RE),
  name: z.string().min(2).max(60),
  tagline: z.string().min(8).max(120),
  emoji: z.string().min(1).max(8),
  score: z.number().min(0).max(10),
  pros: z
    .array(z.string().min(10).max(160))
    .min(QUALITY_CONFIG.minProsPerEntity)
    .max(QUALITY_CONFIG.maxProsPerEntity),
  cons: z
    .array(z.string().min(10).max(160))
    .min(QUALITY_CONFIG.minConsPerEntity)
    .max(QUALITY_CONFIG.maxConsPerEntity),
  bestFor: z.string().min(20).max(300),
});

export const faqItemSchema = z.object({
  question: z
    .string()
    .min(10)
    .max(180)
    .refine((q) => q.trim().endsWith('?'), { message: 'question must end with "?"' }),
  answer: z.string().min(40).max(900),
});

export const verdictSchema = z.object({
  winner: winnerSchema,
  summary: z.string().min(80).max(700),
  recommendation: z.string().min(80).max(700),
});

export const relatedSchema = z.object({
  slug: z.string().regex(PAIR_SLUG_RE, 'related slug must be "a-vs-b"'),
  title: z.string().min(5).max(120),
});

export const frontmatterSchema = z
  .object({
    title: z.string().min(QUALITY_CONFIG.minTitleLength).max(QUALITY_CONFIG.maxTitleLength),
    description: z
      .string()
      .min(QUALITY_CONFIG.minDescriptionLength)
      .max(QUALITY_CONFIG.maxDescriptionLength),
    slug: z.string().regex(PAIR_SLUG_RE, 'slug must be "a-vs-b"'),
    date: z.string().regex(ISO_DATE_RE, 'date must be YYYY-MM-DD'),
    updated: z.string().regex(ISO_DATE_RE, 'updated must be YYYY-MM-DD').optional(),
    category: z.enum(CATEGORY_SLUGS),
    categoryName: z.string().min(2),
    tags: z.array(z.string().min(2).max(40)).min(4).max(8),
    image: z.string().min(1),
    author: z.string().min(2).optional(),
    generatedBy: z.string().min(2).optional(),
    entityA: sideSchema,
    entityB: sideSchema,
    specs: z.array(specRowSchema).min(QUALITY_CONFIG.minSpecRows).max(QUALITY_CONFIG.maxSpecRows),
    verdict: verdictSchema,
    faq: z.array(faqItemSchema).min(QUALITY_CONFIG.minFaqItems).max(QUALITY_CONFIG.maxFaqItems),
    related: z.array(relatedSchema).max(6),
    layout: z.string().optional(),
    draft: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.entityA.id === data.entityB.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entityB', 'id'],
        message: 'entityA and entityB must be different entities',
      });
    }

    const expected = `${data.entityA.id}-vs-${data.entityB.id}`;
    if (data.slug !== expected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slug'],
        message: `slug should be "${expected}"`,
      });
    }

    if (!/\bvs\b/i.test(data.title)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['title'], message: 'title must contain "vs"' });
    }

    const labels = data.specs.map((s) => s.label.toLowerCase());
    const dupLabel = labels.find((l, i) => labels.indexOf(l) !== i);
    if (dupLabel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specs'],
        message: `duplicate spec label "${dupLabel}"`,
      });
    }

    const questions = data.faq.map((f) => f.question.trim().toLowerCase());
    if (new Set(questions).size !== questions.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['faq'], message: 'FAQ questions must be unique' });
    }

    if (data.related.some((r) => r.slug === data.slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['related'],
        message: 'related must not link to this page',
      });
    }
  });

export const generatedComparisonSchema = z.object({
  title: z.string().min(QUALITY_CONFIG.minTitleLength).max(QUALITY_CONFIG.maxTitleLength),
  description: z
    .string()
    .min(QUALITY_CONFIG.minDescriptionLength)
    .max(QUALITY_CONFIG.maxDescriptionLength),
  tags: z.array(z.string().min(2).max(40)).min(4).max(8),
  entityA: sideSchema.pick({ score: true, pros: true, cons: true, bestFor: true }),
  entityB: sideSchema.pick({ score: true, pros: true, cons: true, bestFor: true }),
  specs: z.array(specRowSchema).min(QUALITY_CONFIG.minSpecRows).max(QUALITY_CONFIG.maxSpecRows),
  verdict: verdictSchema,
  faq: z.array(faqItemSchema).min(QUALITY_CONFIG.minFaqItems).max(QUALITY_CONFIG.maxFaqItems),
  content: z.string().min(1500),
});

export type Entity = z.infer<typeof entitySchema>;
export type SpecRow = z.infer<typeof specRowSchema>;
export type Side = z.infer<typeof sideSchema>;
export type FaqItem = z.infer<typeof faqItemSchema>;
export type Verdict = z.infer<typeof verdictSchema>;
export type Related = z.infer<typeof relatedSchema>;
export type Frontmatter = z.infer<typeof frontmatterSchema>;
export type GeneratedComparison = z.infer<typeof generatedComparisonSchema>;

export interface QualityReport {
  slug: string;
  score: number;
  passed: boolean;
  metrics: {
    wordCount: number;
    h2Count: number;
    specCount: number;
    tieRatio: number;
    faqCount: number;
    prosCount: number;
    consCount: number;
  };
  errors: string[];
  warnings: string[];
}

const WORD_RE = /[A-Za-z0-9’'-]+/g;

export function countWords(text: string): number {
  return (text.match(WORD_RE) ?? []).length;
}

export interface QualityInput {
  slug: string;
  content: string;
  specs: SpecRow[];
  verdict: Verdict;
  faqCount: number;
  entityA: { name: string; pros: string[]; cons: string[]; score: number };
  entityB: { name: string; pros: string[]; cons: string[]; score: number };
  /** Upper word bound. Defaults to the AI body target; rendered pages use maxPageWords. */
  maxWords?: number;
}

export function assessQuality(input: QualityInput): QualityReport {
  const { slug, content, specs, verdict, faqCount, entityA, entityB } = input;
  const maxWords = input.maxWords ?? QUALITY_CONFIG.maxWords;
  const errors: string[] = [];
  const warnings: string[] = [];

  const wordCount = countWords(content);
  const h2Count = (content.match(/^##\s+\S/gm) ?? []).length;
  const tieCount = specs.filter((s) => s.winner === 'tie').length;
  const tieRatio = specs.length === 0 ? 0 : Math.round((tieCount / specs.length) * 100) / 100;

  let score = 100;

  if (wordCount < QUALITY_CONFIG.minWords) {
    errors.push(`Word count ${wordCount} is below minimum ${QUALITY_CONFIG.minWords}`);
    score -= 25;
  } else if (wordCount > QUALITY_CONFIG.maxWords) {
    warnings.push(`Word count ${wordCount} exceeds target ${QUALITY_CONFIG.maxWords}`);
    score -= 5;
  }

  if (h2Count < QUALITY_CONFIG.minH2Sections) {
    errors.push(`Only ${h2Count} H2 sections, minimum is ${QUALITY_CONFIG.minH2Sections}`);
    score -= 15;
  }

  if (specs.length < QUALITY_CONFIG.minSpecRows) {
    errors.push(`Only ${specs.length} spec rows, minimum is ${QUALITY_CONFIG.minSpecRows}`);
    score -= 15;
  }

  if (tieRatio > QUALITY_CONFIG.maxTieRatio) {
    errors.push(`${Math.round(tieRatio * 100)}% of spec rows are ties — not enough differentiation`);
    score -= 20;
  }

  const aWins = specs.filter((s) => s.winner === 'a').length;
  const bWins = specs.filter((s) => s.winner === 'b').length;
  if (verdict.winner === 'a' && bWins > aWins) {
    errors.push(`Verdict favours ${entityA.name} but the spec table favours ${entityB.name}`);
    score -= 20;
  }
  if (verdict.winner === 'b' && aWins > bWins) {
    errors.push(`Verdict favours ${entityB.name} but the spec table favours ${entityA.name}`);
    score -= 20;
  }

  if (faqCount < QUALITY_CONFIG.minFaqItems) {
    errors.push(`Only ${faqCount} FAQ items, minimum is ${QUALITY_CONFIG.minFaqItems}`);
    score -= 10;
  }

  for (const side of [entityA, entityB]) {
    const pros = side.pros.map((p) => p.trim().toLowerCase());
    const cons = side.cons.map((c) => c.trim().toLowerCase());

    if (new Set(pros).size !== pros.length) {
      errors.push(`${side.name} has duplicate pros`);
      score -= 10;
    }
    if (new Set(cons).size !== cons.length) {
      errors.push(`${side.name} has duplicate cons`);
      score -= 10;
    }
    const overlap = pros.find((p) => cons.includes(p));
    if (overlap) {
      errors.push(`${side.name} lists "${overlap}" as both a pro and a con`);
      score -= 15;
    }
  }

  if (!content.includes(entityA.name) || !content.includes(entityB.name)) {
    warnings.push('Body does not mention both entity names');
    score -= 5;
  }

  if (Math.abs(entityA.score - entityB.score) > 3) {
    warnings.push('Score gap above 3 points — this pairing may be low value');
    score -= 5;
  }

  if (/as an ai|language model|i cannot|as of my last update|lorem ipsum|\[insert/i.test(content)) {
    errors.push('Content contains AI boilerplate or placeholder text');
    score -= 30;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    slug,
    score,
    passed: errors.length === 0 && score >= QUALITY_CONFIG.passingScore,
    metrics: {
      wordCount,
      h2Count,
      specCount: specs.length,
      tieRatio,
      faqCount,
      prosCount: entityA.pros.length + entityB.pros.length,
      consCount: entityA.cons.length + entityB.cons.length,
    },
    errors,
    warnings,
  };
}

export function validateGeneratedComparison(raw: unknown):
  | { ok: true; data: GeneratedComparison }
  | { ok: false; errors: string[] } {
  const parsed = generatedComparisonSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`),
    };
  }
  return { ok: true, data: parsed.data };
}

export async function validateFile(filePath: string): Promise<QualityReport> {
  const raw = await fs.readFile(filePath, 'utf8');
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, path.extname(filePath));

  const fm = frontmatterSchema.safeParse(data);
  const body = content.replace(/^import\s.+$/gm, '').replace(/<\/?[A-Z][^>]*>/g, '');

  if (!fm.success) {
    return {
      slug,
      score: 0,
      passed: false,
      metrics: {
        wordCount: countWords(body),
        h2Count: (body.match(/^##\s+\S/gm) ?? []).length,
        specCount: 0,
        tieRatio: 0,
        faqCount: 0,
        prosCount: 0,
        consCount: 0,
      },
      errors: fm.error.issues.map(
        (i) => `frontmatter.${i.path.join('.') || 'root'}: ${i.message}`
      ),
      warnings: [],
    };
  }

  const report = assessQuality({
    slug,
    content: body,
    specs: fm.data.specs,
    verdict: fm.data.verdict,
    faqCount: fm.data.faq.length,
    entityA: fm.data.entityA,
    entityB: fm.data.entityB,
  });

  const expectedFile = `${fm.data.slug}.mdx`;
  if (path.basename(filePath) !== expectedFile) {
    report.errors.push(`Filename should be "${expectedFile}"`);
    report.score = Math.max(0, report.score - 10);
    report.passed = false;
  }

  if (fm.data.related.length === 0) {
    report.warnings.push('No related comparisons for internal linking');
  }

  return report;
}

export async function validateDirectory(dir = PATHS.outputDir): Promise<QualityReport[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.mdx'))
    .map((e) => path.join(dir, e.name));

  return Promise.all(files.map(validateFile));
}

function formatReport(report: QualityReport): string {
  const status = report.passed ? 'PASS' : 'FAIL';
  const lines = [
    `[${status}] ${report.slug} — score ${report.score}/100`,
    `        words=${report.metrics.wordCount} h2=${report.metrics.h2Count} specs=${report.metrics.specCount} ties=${Math.round(report.metrics.tieRatio * 100)}% faq=${report.metrics.faqCount}`,
  ];
  for (const e of report.errors) lines.push(`        error: ${e}`);
  for (const w of report.warnings) lines.push(`        warn:  ${w}`);
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const dirArg = args.find((a) => a.startsWith('--dir='))?.split('=')[1];
  const fileArg = args.find((a) => a.startsWith('--file='))?.split('=')[1];
  const strict = args.includes('--strict');

  const reports = fileArg
    ? [await validateFile(path.resolve(fileArg))]
    : await validateDirectory(dirArg ? path.resolve(dirArg) : PATHS.outputDir);

  if (reports.length === 0) {
    console.log('No .mdx comparisons found to validate.');
    return;
  }

  for (const report of reports) {
    console.log(formatReport(report));
  }

  const failed = reports.filter((r) => !r.passed);
  const avg = Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length);
  console.log(
    `\n${reports.length} comparison(s) checked — ${failed.length} below threshold — average score ${avg}/100`
  );

  if (strict && failed.length > 0) {
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isDirectRun) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
