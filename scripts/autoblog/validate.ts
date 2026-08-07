import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import matter from 'gray-matter';
import { CATEGORY_SLUGS, PATHS, QUALITY_CONFIG } from './config';

export const faqItemSchema = z.object({
  question: z.string().min(10).max(180),
  answer: z.string().min(40).max(900),
});

export const frontmatterSchema = z.object({
  title: z.string().min(QUALITY_CONFIG.minTitleLength).max(QUALITY_CONFIG.maxTitleLength),
  description: z
    .string()
    .min(QUALITY_CONFIG.minDescriptionLength)
    .max(QUALITY_CONFIG.maxDescriptionLength),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  category: z.enum(CATEGORY_SLUGS),
  tags: z.array(z.string().min(2).max(40)).min(4).max(8),
  image: z.string().min(1),
  keyword: z.string().min(3).optional(),
  author: z.string().min(2).optional(),
  readTime: z.string().optional(),
  draft: z.boolean().optional(),
});

export const generatedPostSchema = z.object({
  title: z.string().min(QUALITY_CONFIG.minTitleLength).max(QUALITY_CONFIG.maxTitleLength),
  description: z
    .string()
    .min(QUALITY_CONFIG.minDescriptionLength)
    .max(QUALITY_CONFIG.maxDescriptionLength),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(CATEGORY_SLUGS),
  tags: z.array(z.string().min(2).max(40)).min(4).max(8),
  content: z.string().min(1000),
  faq: z.array(faqItemSchema).min(QUALITY_CONFIG.minFaqItems).max(QUALITY_CONFIG.maxFaqItems),
  keyTakeaways: z.array(z.string().min(20).max(240)).min(3).max(5),
});

export type FaqItem = z.infer<typeof faqItemSchema>;
export type Frontmatter = z.infer<typeof frontmatterSchema>;
export type GeneratedPost = z.infer<typeof generatedPostSchema>;

export interface QualityReport {
  slug: string;
  score: number;
  passed: boolean;
  metrics: {
    wordCount: number;
    h2Count: number;
    faqCount: number;
    keywordDensity: number;
    readability: number;
    avgSentenceWords: number;
    hasTableOrList: boolean;
  };
  errors: string[];
  warnings: string[];
}

const WORD_RE = /[A-Za-z0-9’'-]+/g;

export function countWords(text: string): number {
  return (text.match(WORD_RE) ?? []).length;
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const cleaned = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');
  return (cleaned.match(/[aeiouy]{1,2}/g) ?? []).length || 1;
}

export function fleschReadingEase(text: string): number {
  const words = text.match(WORD_RE) ?? [];
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0);
  if (words.length === 0 || sentences.length === 0) return 0;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score =
    206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  return Math.round(score * 10) / 10;
}

export function keywordDensity(text: string, keyword: string): number {
  const total = countWords(text);
  if (total === 0 || !keyword) return 0;
  const escaped = keyword.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = text.toLowerCase().match(new RegExp(`\\b${escaped}\\b`, 'g')) ?? [];
  const keywordWords = countWords(keyword);
  return Math.round(((matches.length * keywordWords) / total) * 1000) / 10;
}

export function averageSentenceWords(text: string): number {
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  return Math.round((countWords(text) / sentences.length) * 10) / 10;
}

export function assessQuality(input: {
  slug: string;
  keyword: string;
  content: string;
  faqCount: number;
}): QualityReport {
  const { slug, keyword, content, faqCount } = input;
  const errors: string[] = [];
  const warnings: string[] = [];

  const prose = content.replace(/^\s*\|.*$/gm, '').replace(/^#{2,6}\s.*$/gm, '');
  const wordCount = countWords(content);
  const h2Count = (content.match(/^##\s+\S/gm) ?? []).length;
  const density = keywordDensity(content, keyword);
  const readability = fleschReadingEase(prose);
  const avgSentenceWords = averageSentenceWords(prose);
  const hasTableOrList = /^\s*[-*]\s+\S/m.test(content) || /^\s*\|.+\|\s*$/m.test(content);

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

  if (faqCount < QUALITY_CONFIG.minFaqItems) {
    errors.push(`Only ${faqCount} FAQ items, minimum is ${QUALITY_CONFIG.minFaqItems}`);
    score -= 10;
  }

  if (density < QUALITY_CONFIG.minKeywordDensity) {
    warnings.push(`Keyword density ${density}% is below ${QUALITY_CONFIG.minKeywordDensity}%`);
    score -= 10;
  } else if (density > QUALITY_CONFIG.maxKeywordDensity) {
    errors.push(`Keyword density ${density}% exceeds ${QUALITY_CONFIG.maxKeywordDensity}% (stuffing)`);
    score -= 20;
  }

  if (readability < QUALITY_CONFIG.minReadability) {
    warnings.push(`Readability ${readability} is below ${QUALITY_CONFIG.minReadability}`);
    score -= 10;
  }

  if (avgSentenceWords > 28) {
    warnings.push(`Average sentence length ${avgSentenceWords} words is too long`);
    score -= 5;
  }

  if (!hasTableOrList) {
    warnings.push('No comparison table or bullet list found');
    score -= 5;
  }

  if (/as an ai|language model|i cannot|as of my last update/i.test(content)) {
    errors.push('Content contains AI boilerplate phrasing');
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
      faqCount,
      keywordDensity: density,
      readability,
      avgSentenceWords,
      hasTableOrList,
    },
    errors,
    warnings,
  };
}

export function validateGeneratedPost(raw: unknown):
  | { ok: true; data: GeneratedPost }
  | { ok: false; errors: string[] } {
  const parsed = generatedPostSchema.safeParse(raw);
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
  const faqCount = (body.match(/^###\s+.+\?\s*$/gm) ?? []).length;

  const report = assessQuality({
    slug,
    keyword: (data as Record<string, unknown>).keyword as string ?? (data as Record<string, unknown>).title as string ?? slug,
    content: body,
    faqCount,
  });

  if (!fm.success) {
    report.errors.unshift(
      ...fm.error.issues.map((i) => `frontmatter.${i.path.join('.') || 'root'}: ${i.message}`)
    );
    report.score = Math.max(0, report.score - 20);
    report.passed = false;
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
    `        words=${report.metrics.wordCount} h2=${report.metrics.h2Count} faq=${report.metrics.faqCount} density=${report.metrics.keywordDensity}% flesch=${report.metrics.readability}`,
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
    console.log('No .mdx posts found to validate.');
    return;
  }

  for (const report of reports) {
    console.log(formatReport(report));
  }

  const failed = reports.filter((r) => !r.passed);
  const avg = Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length);
  console.log(`\n${reports.length} post(s) checked — ${failed.length} below threshold — average score ${avg}/100`);

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
