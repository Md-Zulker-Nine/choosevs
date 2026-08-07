import type { CategorySlug } from './config';

export interface Keyword {
  keyword: string;
  category: CategorySlug;
  difficulty: number;
  searchVolume: number;
}

export const KEYWORDS: Keyword[] = [
  { keyword: 'best budget smartphones 2026', category: 'tech', difficulty: 42, searchVolume: 74000 },
  { keyword: 'iphone 17 vs samsung galaxy s26', category: 'tech', difficulty: 58, searchVolume: 60500 },
  { keyword: 'best laptop for programming 2026', category: 'tech', difficulty: 47, searchVolume: 49500 },
  { keyword: 'oled vs mini led monitors', category: 'tech', difficulty: 35, searchVolume: 22000 },
  { keyword: 'mechanical keyboard switches compared', category: 'tech', difficulty: 31, searchVolume: 18100 },
  { keyword: 'noise cancelling headphones comparison', category: 'tech', difficulty: 44, searchVolume: 33100 },
  { keyword: 'best smartwatch for fitness tracking', category: 'tech', difficulty: 51, searchVolume: 40500 },
  { keyword: 'wifi 7 vs wifi 6e', category: 'tech', difficulty: 29, searchVolume: 14800 },
  { keyword: 'nas vs cloud storage for home', category: 'tech', difficulty: 27, searchVolume: 9900 },
  { keyword: 'best e reader for pdf reading', category: 'tech', difficulty: 24, searchVolume: 8100 },

  { keyword: 'bitcoin vs ethereum investment', category: 'crypto', difficulty: 62, searchVolume: 55000 },
  { keyword: 'best crypto wallets 2026', category: 'crypto', difficulty: 55, searchVolume: 45000 },
  { keyword: 'proof of work vs proof of stake', category: 'crypto', difficulty: 38, searchVolume: 27100 },
  { keyword: 'solana vs cardano comparison', category: 'crypto', difficulty: 41, searchVolume: 18100 },
  { keyword: 'hardware wallet vs software wallet', category: 'crypto', difficulty: 33, searchVolume: 12100 },
  { keyword: 'defi vs cefi platforms', category: 'crypto', difficulty: 36, searchVolume: 9900 },
  { keyword: 'layer 2 scaling solutions compared', category: 'crypto', difficulty: 34, searchVolume: 8100 },
  { keyword: 'stablecoins comparison usdt vs usdc', category: 'crypto', difficulty: 39, searchVolume: 14800 },

  { keyword: 'best digital nomad destinations 2026', category: 'travel', difficulty: 48, searchVolume: 33100 },
  { keyword: 'bali vs thailand for expats', category: 'travel', difficulty: 32, searchVolume: 12100 },
  { keyword: 'cheapest countries to visit in europe', category: 'travel', difficulty: 45, searchVolume: 27100 },
  { keyword: 'travel insurance comparison guide', category: 'travel', difficulty: 57, searchVolume: 22000 },
  { keyword: 'business class vs premium economy', category: 'travel', difficulty: 30, searchVolume: 9900 },
  { keyword: 'airbnb vs hotels which is cheaper', category: 'travel', difficulty: 43, searchVolume: 18100 },
  { keyword: 'best travel credit cards compared', category: 'travel', difficulty: 66, searchVolume: 40500 },
  { keyword: 'japan rail pass vs point to point tickets', category: 'travel', difficulty: 28, searchVolume: 8100 },

  { keyword: 'electric vs hybrid cars 2026', category: 'cars', difficulty: 49, searchVolume: 49500 },
  { keyword: 'tesla model y vs ford mustang mach e', category: 'cars', difficulty: 44, searchVolume: 22000 },
  { keyword: 'best family suv 2026', category: 'cars', difficulty: 52, searchVolume: 60500 },
  { keyword: 'leasing vs buying a car', category: 'cars', difficulty: 46, searchVolume: 33100 },
  { keyword: 'ev charging levels explained', category: 'cars', difficulty: 26, searchVolume: 14800 },
  { keyword: 'awd vs 4wd difference', category: 'cars', difficulty: 37, searchVolume: 27100 },
  { keyword: 'best pickup trucks for towing', category: 'cars', difficulty: 50, searchVolume: 18100 },
  { keyword: 'used ev battery health checklist', category: 'cars', difficulty: 23, searchVolume: 6600 },

  { keyword: 'netflix vs disney plus vs max', category: 'movies', difficulty: 53, searchVolume: 40500 },
  { keyword: 'best sci fi movies of 2026', category: 'movies', difficulty: 40, searchVolume: 33100 },
  { keyword: 'imax vs dolby cinema', category: 'movies', difficulty: 31, searchVolume: 18100 },
  { keyword: 'streaming bundles worth it', category: 'movies', difficulty: 35, searchVolume: 12100 },
  { keyword: 'book vs movie adaptations compared', category: 'movies', difficulty: 25, searchVolume: 8100 },
  { keyword: 'best documentary streaming services', category: 'movies', difficulty: 33, searchVolume: 9900 },
  { keyword: '4k blu ray vs streaming quality', category: 'movies', difficulty: 28, searchVolume: 6600 },

  { keyword: 'chatgpt vs claude vs gemini', category: 'ai-models', difficulty: 59, searchVolume: 74000 },
  { keyword: 'best ai coding assistant 2026', category: 'ai-models', difficulty: 54, searchVolume: 45000 },
  { keyword: 'open source llms compared', category: 'ai-models', difficulty: 42, searchVolume: 22000 },
  { keyword: 'ai image generators comparison', category: 'ai-models', difficulty: 51, searchVolume: 40500 },
  { keyword: 'llm api pricing comparison', category: 'ai-models', difficulty: 38, searchVolume: 14800 },
  { keyword: 'rag vs fine tuning', category: 'ai-models', difficulty: 34, searchVolume: 12100 },
  { keyword: 'local ai models vs cloud apis', category: 'ai-models', difficulty: 30, searchVolume: 9900 },
  { keyword: 'ai voice generators compared', category: 'ai-models', difficulty: 36, searchVolume: 18100 },

  { keyword: 'best countries for quality of life 2026', category: 'countries', difficulty: 47, searchVolume: 33100 },
  { keyword: 'portugal vs spain for retirement', category: 'countries', difficulty: 39, searchVolume: 18100 },
  { keyword: 'cost of living comparison usa vs canada', category: 'countries', difficulty: 43, searchVolume: 27100 },
  { keyword: 'best healthcare systems by country', category: 'countries', difficulty: 45, searchVolume: 22000 },
  { keyword: 'safest countries in the world', category: 'countries', difficulty: 50, searchVolume: 49500 },
  { keyword: 'digital nomad visa requirements compared', category: 'countries', difficulty: 37, searchVolume: 14800 },
  { keyword: 'singapore vs dubai for expats', category: 'countries', difficulty: 35, searchVolume: 12100 },
  { keyword: 'tax friendly countries for remote workers', category: 'countries', difficulty: 41, searchVolume: 9900 },
];

export function getKeywords(options: {
  count?: number;
  category?: CategorySlug;
  maxDifficulty?: number;
  minSearchVolume?: number;
} = {}): Keyword[] {
  const { count, category, maxDifficulty, minSearchVolume } = options;

  let pool = KEYWORDS.slice();

  if (category) {
    pool = pool.filter((k) => k.category === category);
  }
  if (typeof maxDifficulty === 'number') {
    pool = pool.filter((k) => k.difficulty <= maxDifficulty);
  }
  if (typeof minSearchVolume === 'number') {
    pool = pool.filter((k) => k.searchVolume >= minSearchVolume);
  }

  pool.sort((a, b) => b.searchVolume / (b.difficulty || 1) - a.searchVolume / (a.difficulty || 1));

  return typeof count === 'number' ? pool.slice(0, count) : pool;
}

export function getCategoryCounts(): Record<string, number> {
  return KEYWORDS.reduce<Record<string, number>>((acc, k) => {
    acc[k.category] = (acc[k.category] ?? 0) + 1;
    return acc;
  }, {});
}
