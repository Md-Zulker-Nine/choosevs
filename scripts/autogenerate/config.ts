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
  temperature: 0.5,
  topP: 0.9,
  topK: 40,
  responseMimeType: 'application/json',
  timeoutMs: 90_000,
  maxRetries: 3,
  retryDelayMs: 2_000,
};

export const PATHS = {
  outputDir: path.join(PROJECT_ROOT, 'src', 'pages', 'compare'),
  entitiesDir: path.join(__dirname, 'entities'),
  promptsDir: path.join(__dirname, 'prompts'),
  comparisonTemplate: path.join(__dirname, 'prompts', 'comparison.md.hbs'),
};

export const GENERATION_CONFIG = {
  batchSize: 10,
  maxBatchSize: 50,
  delayBetweenPagesMs: 1_500,
  skipExisting: true,
  defaultAuthor: 'ChooseVS Team',
  defaultImage: '/og-image.jpg',
  relatedCount: 3,
};

export const QUALITY_CONFIG = {
  minWords: 500,
  maxWords: 1100,
  maxPageWords: 1800,
  minH2Sections: 4,
  minSpecRows: 6,
  maxSpecRows: 14,
  minProsPerEntity: 4,
  maxProsPerEntity: 8,
  minConsPerEntity: 3,
  maxConsPerEntity: 8,
  minFaqItems: 3,
  maxFaqItems: 6,
  maxTieRatio: 0.5,
  minTitleLength: 20,
  maxTitleLength: 70,
  minDescriptionLength: 80,
  maxDescriptionLength: 160,
  passingScore: 70,
};

export const CATEGORY_SLUGS = ['tech', 'cars', 'crypto'] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface CategoryDefinition {
  name: string;
  files: string[];
  crossBrandOnly: boolean;
  specLabels: Record<string, string>;
}

export const CATEGORIES: Record<CategorySlug, CategoryDefinition> = {
  tech: {
    name: 'Technology',
    files: ['phones.json', 'laptops.json'],
    crossBrandOnly: false,
    specLabels: {
      display: 'Display',
      chip: 'Processor',
      cpu: 'Processor',
      gpu: 'Graphics',
      ram: 'Memory',
      storage: 'Storage',
      camera: 'Main Camera',
      battery: 'Battery',
      batteryLife: 'Battery Life',
      charging: 'Charging',
      weight: 'Weight',
      ports: 'Ports',
      os: 'Operating System',
      price: 'Starting Price',
    },
  },
  cars: {
    name: 'Cars & Vehicles',
    files: ['cars.json'],
    crossBrandOnly: true,
    specLabels: {
      engine: 'Engine',
      horsepower: 'Horsepower',
      torque: 'Torque',
      mpg: 'Fuel Economy',
      range: 'Range',
      zeroToSixty: '0-60 mph',
      drivetrain: 'Drivetrain',
      seating: 'Seating',
      cargo: 'Cargo Space',
      price: 'Starting MSRP',
    },
  },
  crypto: {
    name: 'Cryptocurrency',
    files: ['crypto.json'],
    crossBrandOnly: false,
    specLabels: {
      symbol: 'Ticker',
      marketCap: 'Market Cap',
      consensus: 'Consensus',
      launchYear: 'Launch Year',
      blockTime: 'Block Time',
      throughput: 'Throughput',
      maxSupply: 'Max Supply',
      smartContracts: 'Smart Contracts',
      useCase: 'Primary Use Case',
      staking: 'Staking',
    },
  },
};

export const PAIRING_CONFIG = {
  minPriority: 20,
  maxTierGap: 2,
  sameBrandPenalty: 25,
  crossBrandBonus: 15,
  tierMismatchPenalty: 30,
};

export const LOWER_IS_BETTER_SPECS = new Set([
  'price',
  'weight',
  'zeroToSixty',
  'blockTime',
]);

export function getApiKey(): string {
  const key = process.env[AI_CONFIG.apiKeyEnvVar];
  if (!key) {
    throw new Error(
      `Missing ${AI_CONFIG.apiKeyEnvVar}. Set it in your environment or .env file before running comparison generation.`
    );
  }
  return key;
}
