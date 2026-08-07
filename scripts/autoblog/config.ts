import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export const AI_CONFIG = {
  provider: 'google' as const,
  model: 'gemini-2.0-flash',
  apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  apiKeyEnvVar: 'GEMINI_API_KEY',
  maxTokens: 4000,
  temperature: 0.4,
  topP: 0.9,
  topK: 40,
  responseMimeType: 'application/json',
  timeoutMs: 120_000,
  maxRetries: 3,
  retryDelayMs: 2_000,
};

export const PATHS = {
  outputDir: path.join(PROJECT_ROOT, 'src', 'pages', 'blog'),
  promptsDir: path.join(__dirname, 'prompts'),
  postTemplate: path.join(__dirname, 'prompts', 'blog-post.md.hbs'),
};

export const GENERATION_CONFIG = {
  batchSize: 5,
  maxBatchSize: 25,
  delayBetweenPostsMs: 1_500,
  skipExisting: true,
  defaultAuthor: 'ChooseVS Team',
  defaultImage: '/og-image.jpg',
  wordsPerMinute: 225,
};

export const QUALITY_CONFIG = {
  minWords: 1000,
  maxWords: 1500,
  minH2Sections: 5,
  minFaqItems: 4,
  maxFaqItems: 6,
  minKeywordDensity: 0.4,
  maxKeywordDensity: 2.5,
  minReadability: 45,
  minTitleLength: 20,
  maxTitleLength: 70,
  minDescriptionLength: 80,
  maxDescriptionLength: 160,
  passingScore: 70,
};

export const CATEGORY_SLUGS = [
  'tech',
  'movies',
  'countries',
  'cars',
  'travel',
  'crypto',
  'ai-models',
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export function getApiKey(): string {
  const key = process.env[AI_CONFIG.apiKeyEnvVar];
  if (!key) {
    throw new Error(
      `Missing ${AI_CONFIG.apiKeyEnvVar}. Set it in your environment or .env file before running blog generation.`
    );
  }
  return key;
}
