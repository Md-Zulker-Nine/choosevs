import type { CategorySlug } from './config';

export interface Keyword {
  keyword: string;
  category: CategorySlug;
  difficulty: number;
  searchVolume: number;
}

export const KEYWORDS: Keyword[] = [
  // === TECH - Smartphones ===
  { keyword: 'best budget smartphones 2026', category: 'tech', difficulty: 42, searchVolume: 74000 },
  { keyword: 'iphone 17 vs samsung galaxy s26', category: 'tech', difficulty: 58, searchVolume: 60500 },
  { keyword: 'best camera phone 2026', category: 'tech', Difficulty: 55, searchVolume: 55000 },
  { keyword: 'best phone for gaming 2026', category: 'tech', difficulty: 48, searchVolume: 45000 },
  { keyword: 'google pixel 10 vs iphone 17', category: 'tech', difficulty: 52, searchVolume: 40000 },
  { keyword: 'best android phone under 500', category: 'tech', difficulty: 44, searchVolume: 38000 },
  { keyword: 'oneplus 14 vs samsung s26', category: 'tech', difficulty: 40, searchVolume: 35000 },
  { keyword: 'best phone for photography beginners', category: 'tech', difficulty: 35, searchVolume: 30000 },
  { keyword: 'motorola edge vs google pixel', category: 'tech', difficulty: 30, searchVolume: 25000 },
  { keyword: 'best flip phone 2026', category: 'tech', difficulty: 38, searchVolume: 22000 },

  // === TECH - Laptops ===
  { keyword: 'best laptop for programming 2026', category: 'tech', difficulty: 47, searchVolume: 49500 },
  { keyword: 'macbook pro vs dell xps 16', category: 'tech', difficulty: 53, searchVolume: 42000 },
  { keyword: 'best laptop for college students 2026', category: 'tech', difficulty: 45, searchVolume: 38000 },
  { keyword: 'thinkpad vs macbook for business', category: 'tech', difficulty: 42, searchVolume: 32000 },
  { keyword: 'best gaming laptop under 1500', category: 'tech', difficulty: 50, searchVolume: 45000 },
  { keyword: 'asus zenbook vs macbook air', category: 'tech', difficulty: 36, searchVolume: 28000 },
  { keyword: 'best 2 in 1 laptop 2026', category: 'tech', difficulty: 40, searchVolume: 25000 },
  { keyword: 'framework laptop vs thinkpad', category: 'tech', difficulty: 28, searchVolume: 18000 },
  { keyword: 'best laptop for video editing 2026', category: 'tech', difficulty: 48, searchVolume: 35000 },
  { keyword: 'hp spectre vs macbook pro', category: 'tech', difficulty: 33, searchVolume: 22000 },

  // === TECH - Audio ===
  { keyword: 'noise cancelling headphones comparison', category: 'tech', difficulty: 44, searchVolume: 33100 },
  { keyword: 'sony wh1000xm6 vs airpods max', category: 'tech', difficulty: 46, searchVolume: 30000 },
  { keyword: 'best earbuds for running 2026', category: 'tech', difficulty: 42, searchVolume: 28000 },
  { keyword: 'airpods pro 3 vs sony wf1000xm6', category: 'tech', difficulty: 40, searchVolume: 25000 },
  { keyword: 'best budget wireless earbuds', category: 'tech', difficulty: 38, searchVolume: 35000 },
  { keyword: 'bone conduction vs earbuds', category: 'tech', difficulty: 25, searchVolume: 15000 },
  { keyword: 'best headphones for mixing music', category: 'tech', difficulty: 35, searchVolume: 18000 },
  { keyword: 'bose quietcomfort vs sony noise cancelling', category: 'tech', difficulty: 37, searchVolume: 20000 },

  // === TECH - TV & Monitors ===
  { keyword: 'oled vs mini led monitors', category: 'tech', difficulty: 35, searchVolume: 22000 },
  { keyword: 'best 4k monitor for mac 2026', category: 'tech', difficulty: 32, searchVolume: 18000 },
  { keyword: 'samsung vs lg oled tv 2026', category: 'tech', difficulty: 48, searchVolume: 35000 },
  { keyword: 'best monitor for dual setup', category: 'tech', difficulty: 30, searchVolume: 15000 },
  { keyword: 'ultrawide vs dual monitor setup', category: 'tech', difficulty: 28, searchVolume: 12000 },
  { keyword: 'best gaming monitor 2026', category: 'tech', difficulty: 45, searchVolume: 30000 },

  // === TECH - Smart Home ===
  { keyword: 'best smartwatch for fitness tracking', category: 'tech', difficulty: 51, searchVolume: 40500 },
  { keyword: 'apple watch vs galaxy watch 2026', category: 'tech', difficulty: 48, searchVolume: 35000 },
  { keyword: 'best smart home hub 2026', category: 'tech', difficulty: 35, searchVolume: 22000 },
  { keyword: 'alexa vs google home vs siri', category: 'tech', difficulty: 40, searchVolume: 28000 },
  { keyword: 'robot vacuum vs robot mop', category: 'tech', difficulty: 38, searchVolume: 25000 },
  { keyword: 'best robot vacuum for pet hair', category: 'tech', difficulty: 36, searchVolume: 20000 },
  { keyword: 'smart lock comparison 2026', category: 'tech', difficulty: 30, searchVolume: 15000 },
  { keyword: 'ring vs nest doorbell', category: 'tech', difficulty: 32, searchVolume: 18000 },

  // === TECH - Networking ===
  { keyword: 'wifi 7 vs wifi 6e', category: 'tech', difficulty: 29, searchVolume: 14800 },
  { keyword: 'mesh wifi vs wifi extender', category: 'tech', difficulty: 33, searchVolume: 18000 },
  { keyword: 'nas vs cloud storage for home', category: 'tech', difficulty: 27, searchVolume: 9900 },
  { keyword: 'best router for gaming 2026', category: 'tech', difficulty: 38, searchVolume: 22000 },
  { keyword: 'powerline vs mesh wifi', category: 'tech', difficulty: 24, searchVolume: 12000 },

  // === TECH - Peripherals ===
  { keyword: 'mechanical keyboard switches compared', category: 'tech', difficulty: 31, searchVolume: 18100 },
  { keyword: 'ergonomic mouse vs regular mouse', category: 'tech', difficulty: 26, searchVolume: 14000 },
  { keyword: 'best webcam for streaming 2026', category: 'tech', difficulty: 34, searchVolume: 20000 },
  { keyword: 'stream deck vs loupedeck', category: 'tech', difficulty: 22, searchVolume: 10000 },
  { keyword: ' Drawing tablet vs ipad for art', category: 'tech', difficulty: 30, searchVolume: 15000 },

  // === CRYPTO ===
  { keyword: 'bitcoin vs ethereum investment', category: 'crypto', difficulty: 62, searchVolume: 55000 },
  { keyword: 'best crypto wallets 2026', category: 'crypto', difficulty: 55, searchVolume: 45000 },
  { keyword: 'proof of work vs proof of stake', category: 'crypto', difficulty: 38, searchVolume: 27100 },
  { keyword: 'solana vs cardano comparison', category: 'crypto', difficulty: 41, searchVolume: 18100 },
  { keyword: 'hardware wallet vs software wallet', category: 'crypto', difficulty: 33, searchVolume: 12100 },
  { keyword: 'defi vs cefi platforms', category: 'crypto', difficulty: 36, searchVolume: 9900 },
  { keyword: 'layer 2 scaling solutions compared', category: 'crypto', difficulty: 34, searchVolume: 8100 },
  { keyword: 'stablecoins comparison usdt vs usdc', category: 'crypto', difficulty: 39, searchVolume: 14800 },
  { keyword: 'best crypto exchange 2026', category: 'crypto', difficulty: 58, searchVolume: 40000 },
  { keyword: 'bitcoin vs gold investment', category: 'crypto', difficulty: 50, searchVolume: 35000 },
  { keyword: 'ethereum vs solana vs avalanche', category: 'crypto', difficulty: 44, searchVolume: 25000 },
  { keyword: 'crypto staking rewards compared', category: 'crypto', difficulty: 35, searchVolume: 18000 },
  { keyword: 'meme coins vs altcoins', category: 'crypto', difficulty: 30, searchVolume: 15000 },
  { keyword: 'cold wallet vs hot wallet', category: 'crypto', difficulty: 28, searchVolume: 12000 },
  { keyword: 'crypto tax software comparison', category: 'crypto', difficulty: 32, searchVolume: 20000 },
  { keyword: 'nft marketplace comparison 2026', category: 'crypto', difficulty: 25, searchVolume: 10000 },

  // === TRAVEL ===
  { keyword: 'best digital nomad destinations 2026', category: 'travel', difficulty: 48, searchVolume: 33100 },
  { keyword: 'bali vs thailand for expats', category: 'travel', difficulty: 32, searchVolume: 12100 },
  { keyword: 'cheapest countries to visit in europe', category: 'travel', difficulty: 45, searchVolume: 27100 },
  { keyword: 'travel insurance comparison guide', category: 'travel', difficulty: 57, searchVolume: 22000 },
  { keyword: 'business class vs premium economy', category: 'travel', difficulty: 30, searchVolume: 9900 },
  { keyword: 'airbnb vs hotels which is cheaper', category: 'travel', difficulty: 43, searchVolume: 18100 },
  { keyword: 'best travel credit cards compared', category: 'travel', difficulty: 66, searchVolume: 40500 },
  { keyword: 'japan rail pass vs point to point tickets', category: 'travel', difficulty: 28, searchVolume: 8100 },
  { keyword: 'southeast asia backpacking route 2026', category: 'travel', difficulty: 35, searchVolume: 25000 },
  { keyword: 'iceland vs norway for northern lights', category: 'travel', difficulty: 30, searchVolume: 18000 },
  { keyword: 'best all inclusive resorts 2026', category: 'travel', difficulty: 52, searchVolume: 35000 },
  { keyword: 'solo travel vs group tour', category: 'travel', difficulty: 33, searchVolume: 15000 },
  { keyword: 'travel backpack comparison 2026', category: 'travel', difficulty: 28, searchVolume: 12000 },
  { keyword: 'car rental vs public transport abroad', category: 'travel', difficulty: 30, searchVolume: 10000 },
  { keyword: 'best travel apps 2026', category: 'travel', difficulty: 38, searchVolume: 22000 },
  { keyword: 'travel during shoulder season vs peak', category: 'travel', difficulty: 25, searchVolume: 8000 },

  // === CARS ===
  { keyword: 'electric vs hybrid cars 2026', category: 'cars', difficulty: 49, searchVolume: 49500 },
  { keyword: 'tesla model y vs ford mustang mach e', category: 'cars', difficulty: 44, searchVolume: 22000 },
  { keyword: 'best family suv 2026', category: 'cars', difficulty: 52, searchVolume: 60500 },
  { keyword: 'leasing vs buying a car', category: 'cars', difficulty: 46, searchVolume: 33100 },
  { keyword: 'ev charging levels explained', category: 'cars', difficulty: 26, searchVolume: 14800 },
  { keyword: 'awd vs 4wd difference', category: 'cars', difficulty: 37, searchVolume: 27100 },
  { keyword: 'best pickup trucks for towing', category: 'cars', difficulty: 50, searchVolume: 18100 },
  { keyword: 'used ev battery health checklist', category: 'cars', difficulty: 23, searchVolume: 6600 },
  { keyword: 'tesla model 3 vs bmw i4', category: 'cars', difficulty: 42, searchVolume: 25000 },
  { keyword: 'toyota camry vs honda accord 2026', category: 'cars', difficulty: 48, searchVolume: 35000 },
  { keyword: 'hyundai ioniq 5 vs tesla model y', category: 'cars', difficulty: 38, searchVolume: 22000 },
  { keyword: 'best electric truck 2026', category: 'cars', difficulty: 45, searchVolume: 30000 },
  { keyword: 'gas vs diesel vs hybrid vs electric', category: 'cars', difficulty: 40, searchVolume: 28000 },
  { keyword: 'car warranty comparison 2026', category: 'cars', difficulty: 30, searchVolume: 18000 },
  { keyword: 'best first car for teens 2026', category: 'cars', difficulty: 35, searchVolume: 20000 },
  { keyword: 'suv vs sedan vs hatchback', category: 'cars', difficulty: 32, searchVolume: 15000 },
  { keyword: 'tesla supercharger vs evgo vs chargepoint', category: 'cars', difficulty: 36, searchVolume: 22000 },
  { keyword: 'luxury ev vs luxury gas car', category: 'cars', difficulty: 42, searchVolume: 18000 },

  // === MOVIES & TV ===
  { keyword: 'netflix vs disney plus vs max', category: 'movies', difficulty: 53, searchVolume: 40500 },
  { keyword: 'best sci fi movies of 2026', category: 'movies', difficulty: 40, searchVolume: 33100 },
  { keyword: 'imax vs dolby cinema', category: 'movies', difficulty: 31, searchVolume: 18100 },
  { keyword: 'streaming bundles worth it', category: 'movies', difficulty: 35, searchVolume: 12100 },
  { keyword: 'book vs movie adaptations compared', category: 'movies', difficulty: 25, searchVolume: 8100 },
  { keyword: 'best documentary streaming services', category: 'movies', difficulty: 33, searchVolume: 9900 },
  { keyword: '4k blu ray vs streaming quality', category: 'movies', difficulty: 28, searchVolume: 6600 },
  { keyword: 'marvel vs dc movies 2026', category: 'movies', difficulty: 50, searchVolume: 35000 },
  { keyword: 'best korean drama streaming 2026', category: 'movies', difficulty: 35, searchVolume: 25000 },
  { keyword: 'disney plus vs apple tv plus', category: 'movies', difficulty: 42, searchVolume: 28000 },
  { keyword: 'best anime streaming services 2026', category: 'movies', difficulty: 38, searchVolume: 22000 },
  { keyword: 'hbo max vs paramount plus', category: 'movies', difficulty: 36, searchVolume: 18000 },
  { keyword: 'live tv streaming services compared', category: 'movies', difficulty: 40, searchVolume: 20000 },
  { keyword: 'best projector vs big tv 2026', category: 'movies', difficulty: 32, searchVolume: 15000 },

  // === AI MODELS ===
  { keyword: 'chatgpt vs claude vs gemini', category: 'ai-models', difficulty: 59, searchVolume: 74000 },
  { keyword: 'best ai coding assistant 2026', category: 'ai-models', difficulty: 54, searchVolume: 45000 },
  { keyword: 'open source llms compared', category: 'ai-models', difficulty: 42, searchVolume: 22000 },
  { keyword: 'ai image generators comparison', category: 'ai-models', difficulty: 51, searchVolume: 40500 },
  { keyword: 'llm api pricing comparison', category: 'ai-models', difficulty: 38, searchVolume: 14800 },
  { keyword: 'rag vs fine tuning', category: 'ai-models', difficulty: 34, searchVolume: 12100 },
  { keyword: 'local ai models vs cloud apis', category: 'ai-models', difficulty: 30, searchVolume: 9900 },
  { keyword: 'ai voice generators compared', category: 'ai-models', difficulty: 36, searchVolume: 18100 },
  { keyword: 'claude ai vs chatgpt vs perplexity', category: 'ai-models', difficulty: 48, searchVolume: 35000 },
  { keyword: 'best ai for writing essays', category: 'ai-models', difficulty: 45, searchVolume: 30000 },
  { keyword: 'ai video generators compared 2026', category: 'ai-models', difficulty: 42, searchVolume: 25000 },
  { keyword: 'gemini vs copilot vs chatgpt', category: 'ai-models', difficulty: 50, searchVolume: 28000 },
  { keyword: 'ai chatbot comparison for business', category: 'ai-models', difficulty: 38, searchVolume: 22000 },
  { keyword: 'best free ai tools 2026', category: 'ai-models', difficulty: 40, searchVolume: 35000 },
  { keyword: 'ai search engines compared', category: 'ai-models', difficulty: 35, searchVolume: 18000 },
  { keyword: 'llm benchmarks explained', category: 'ai-models', difficulty: 30, searchVolume: 15000 },
  { keyword: 'ai agents vs ai assistants', category: 'ai-models', difficulty: 32, searchVolume: 12000 },
  { keyword: 'best ai for data analysis', category: 'ai-models', difficulty: 36, searchVolume: 20000 },

  // === COUNTRIES ===
  { keyword: 'best countries for quality of life 2026', category: 'countries', difficulty: 47, searchVolume: 33100 },
  { keyword: 'portugal vs spain for retirement', category: 'countries', difficulty: 39, searchVolume: 18100 },
  { keyword: 'cost of living comparison usa vs canada', category: 'countries', difficulty: 43, searchVolume: 27100 },
  { keyword: 'best healthcare systems by country', category: 'countries', difficulty: 45, searchVolume: 22000 },
  { keyword: 'safest countries in the world', category: 'countries', difficulty: 50, searchVolume: 49500 },
  { keyword: 'digital nomad visa requirements compared', category: 'countries', difficulty: 37, searchVolume: 14800 },
  { keyword: 'singapore vs dubai for expats', category: 'countries', difficulty: 35, searchVolume: 12100 },
  { keyword: 'tax friendly countries for remote workers', category: 'countries', difficulty: 41, searchVolume: 9900 },
  { keyword: 'best countries for startups 2026', category: 'countries', difficulty: 38, searchVolume: 25000 },
  { keyword: 'canada vs australia for immigration', category: 'countries', difficulty: 42, searchVolume: 22000 },
  { keyword: 'best european countries for expats', category: 'countries', difficulty: 40, searchVolume: 18000 },
  { keyword: 'germany vs netherlands for skilled workers', category: 'countries', difficulty: 33, searchVolume: 15000 },
  { keyword: 'cost of living bali vs portugal', category: 'countries', difficulty: 30, searchVolume: 12000 },
  { keyword: 'best countries for solo female travelers', category: 'countries', difficulty: 35, searchVolume: 20000 },
  { keyword: 'most visited countries 2026', category: 'countries', difficulty: 32, searchVolume: 15000 },
  { keyword: 'passport strength ranking 2026', category: 'countries', difficulty: 28, searchVolume: 10000 },
  { keyword: 'best countries for us expats', category: 'countries', difficulty: 36, searchVolume: 18000 },
  { keyword: 'new zealand vs switzerland quality of life', category: 'countries', difficulty: 25, searchVolume: 8000 },

  // === FINANCE (bonus category content) ===
  { keyword: 'roth ira vs traditional ira 2026', category: 'crypto', difficulty: 45, searchVolume: 35000 },
  { keyword: 'high yield savings vs money market', category: 'crypto', difficulty: 38, searchVolume: 28000 },
  { keyword: 'index funds vs etfs vs mutual funds', category: 'crypto', difficulty: 42, searchVolume: 32000 },
  { keyword: 'term life vs whole life insurance', category: 'crypto', difficulty: 40, searchVolume: 25000 },
  { keyword: 'credit card rewards programs compared', category: 'crypto', difficulty: 50, searchVolume: 30000 },
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

  // Sort by value (search volume / difficulty ratio)
  pool.sort((a, b) => b.searchVolume / (b.difficulty || 1) - a.searchVolume / (a.difficulty || 1));

  return typeof count === 'number' ? pool.slice(0, count) : pool;
}

export function getCategoryCounts(): Record<string, number> {
  return KEYWORDS.reduce<Record<string, number>>((acc, k) => {
    acc[k.category] = (acc[k.category] ?? 0) + 1;
    return acc;
  }, {});
}
