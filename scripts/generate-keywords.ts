// scripts/generate-keywords.ts
// Mix and match existing keywords to create 350+ unique variations

import { KEYWORDS } from './autoblog/keywords';

// Extract entities from existing keywords
const entities: Record<string, string[]> = {
  tech: [
    'iPhone 17', 'Samsung Galaxy S26', 'Google Pixel 10', 'OnePlus 14', 'MacBook Pro', 'Dell XPS 16',
    'ThinkPad', 'ASUS ZenBook', 'HP Spectre', 'AirPods Max', 'Sony WH1000XM6', 'AirPods Pro 3',
    'Apple Watch', 'Galaxy Watch', 'iPad Pro', 'Surface Pro', 'Nintendo Switch 2', 'PS5 Pro',
    'OLED TV', 'Mini LED monitor', 'WiFi 7 router', 'mesh WiFi', 'robot vacuum', 'smart lock',
    'Ring doorbell', 'Nest thermostat', 'DJI drone', 'GoPro', 'Kindle', 'Steam Deck',
  ],
  crypto: [
    'Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Avalanche', 'Polygon', 'Chainlink', 'Ripple',
    'Ledger', 'Trezor', 'Coinbase', 'Binance', 'Kraken', 'USDT', 'USDC', 'Dai',
    'Uniswap', 'Aave', 'Compound', 'OpenSea', 'Rarible',
  ],
  travel: [
    'Bali', 'Thailand', 'Portugal', 'Spain', 'Japan', 'Iceland', 'Norway', 'Greece',
    'Mexico', 'Costa Rica', 'Vietnam', 'Indonesia', 'Maldives', 'Fiji', 'New Zealand',
    'Airbnb', 'Booking.com', 'Expedia', 'Skyscanner', 'Priority Pass',
  ],
  cars: [
    'Tesla Model Y', 'Tesla Model 3', 'Ford Mustang Mach E', 'BMW i4', 'Hyundai Ioniq 5',
    'Toyota Camry', 'Honda Accord', 'Toyota RAV4', 'Honda CR-V', 'Ford F-150',
    'Chevy Silverado', 'Rivian R1T', 'Lucid Air', 'Porsche Taycan', 'Volkswagen ID.4',
  ],
  movies: [
    'Netflix', 'Disney+', 'HBO Max', 'Apple TV+', 'Amazon Prime', 'Paramount+', 'Hulu',
    'Peacock', 'Crunchyroll', 'IMAX', 'Dolby Cinema', '4K Blu-ray', 'Projector',
  ],
  ai: [
    'ChatGPT', 'Claude AI', 'Gemini', 'Copilot', 'Perplexity', 'Midjourney', 'DALL-E',
    'Stable Diffusion', 'Runway', 'ElevenLabs', 'Sora', 'Cursor', 'GitHub Copilot',
    'Llama 3', 'Mistral', 'Claude Sonnet', 'GPT-4o', 'Gemini Pro',
  ],
  countries: [
    'Portugal', 'Spain', 'Germany', 'Netherlands', 'Canada', 'Australia', 'New Zealand',
    'Singapore', 'Dubai', 'Switzerland', 'Norway', 'Denmark', 'Sweden', 'Ireland',
    'Japan', 'South Korea', 'Thailand', 'Vietnam', 'Mexico', 'Costa Rica',
  ],
};

const modifiers = [
  'vs', 'compared to', 'compared with', 'versus', 'or',
  'review', 'guide', 'buying guide', 'comparison', 'showdown',
  'best', 'top', 'ultimate', 'complete', 'in-depth',
  'pros and cons', 'worth it', 'is it worth it', 'should you buy',
  'for beginners', 'for professionals', 'for students', 'for business',
  'under 500', 'under 1000', 'budget', 'premium', 'luxury',
  '2026', '2025', 'latest', 'new',
  'vs the competition', 'vs last year model', 'vs the alternative',
  'worth the money', 'worth the hype', 'overrated or underrated',
  'long term review', 'after 6 months', 'one year later',
  'for families', 'for seniors', 'for kids', 'for travel',
  'for photography', 'for gaming', 'for work', 'for school',
  'pros', 'cons', 'advantages', 'disadvantages', 'benefits',
  'features', 'specifications', 'specs', 'benchmarks', 'performance',
  'price comparison', 'cost analysis', 'value for money',
  'alternatives', 'competitors', 'similar to', 'like',
  'tips', 'tricks', 'hacks', 'mistakes to avoid', 'what to know',
  'before buying', 'after buying', 'user experience', 'real world',
  'expert opinion', 'consumer reports', 'ratings', 'scores',
];

const questionStarters = [
  'which is better', 'what is the difference', 'how does', 'why is',
  'is', 'are', 'can', 'should', 'will', 'does',
  'what are the best', 'how to choose', 'how to pick', 'how to decide',
  'where to buy', 'when to buy', 'when is the best time to buy',
  'how much does', 'how expensive is', 'what is the price of',
  'why should I choose', 'why is better than', 'why is worse than',
  'is it worth', 'is it better than', 'is it good enough',
  'do I need', 'do you need', 'should I upgrade to',
  'can you use', 'can I use', 'will replace',
];

function generateKeywords(): Set<string> {
  const keywords = new Set<string>();

  // Add all original keywords
  KEYWORDS.forEach(k => keywords.add(k.keyword));

  // Generate mix-up keywords
  for (const [category, items] of Object.entries(entities)) {
    // Pairwise comparisons within category
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        // Direct comparisons
        keywords.add(`${a} vs ${b}`);
        keywords.add(`${a} vs ${b} 2026`);
        keywords.add(`${a} compared to ${b}`);
        keywords.add(`${a} or ${b} which is better`);
        keywords.add(`${a} versus ${b}`);
        keywords.add(`difference between ${a} and ${b}`);
        keywords.add(`${a} vs ${b} comparison`);
        keywords.add(`${a} vs ${b} which should you buy`);
        keywords.add(`${a} vs ${b} worth it`);
        keywords.add(`${a} vs ${b} pros and cons`);
        keywords.add(`${a} vs ${b} review`);
        keywords.add(`${a} vs ${b} for beginners`);
        keywords.add(`${a} vs ${b} for professionals`);
        keywords.add(`${a} vs ${b} for gaming`);
        keywords.add(`${a} vs ${b} for work`);
        keywords.add(`${a} vs ${b} for photography`);
        keywords.add(`${a} vs ${b} for travel`);
        keywords.add(`${a} vs ${b} for students`);
        keywords.add(`${a} vs ${b} for business`);
        keywords.add(`${a} vs ${b} price comparison`);
        keywords.add(`${a} vs ${b} which is best`);
        keywords.add(`${a} vs ${b} which is better for you`);
        keywords.add(`${a} vs ${b} which to choose`);
        keywords.add(`${a} vs ${b} which one to buy`);
        keywords.add(`${a} vs ${b} which is worth it`);
        keywords.add(`${a} vs ${b} which is more durable`);
        keywords.add(`${a} vs ${b} which has better camera`);
        keywords.add(`${a} vs ${b} which has better battery`);
        keywords.add(`${a} vs ${b} which is faster`);
        keywords.add(`${a} vs ${b} which is cheaper`);
        keywords.add(`${a} vs ${b} which is more reliable`);
        keywords.add(`${a} vs ${b} which is easier to use`);
        keywords.add(`${a} vs ${b} which is more popular`);
        keywords.add(`${a} vs ${b} which is trending`);
        keywords.add(`${a} vs ${b} which is recommended`);
        keywords.add(`${a} vs ${b} which is the best value`);
        keywords.add(`${a} vs ${b} which is the best choice`);
        keywords.add(`${a} vs ${b} which is the right pick`);
        keywords.add(`${a} vs ${b} which is the smart choice`);
        keywords.add(`${a} vs ${b} which is the better investment`);
        keywords.add(`${a} vs ${b} which is the better deal`);
        keywords.add(`${a} vs ${b} which is the better option`);
        keywords.add(`${a} vs ${b} which is the better buy`);
        keywords.add(`${a} vs ${b} which is the better phone`);
        keywords.add(`${a} vs ${b} which is the better laptop`);
        keywords.add(`${a} vs ${b} which is the better car`);
        keywords.add(`${a} vs ${b} which is the better choice for you`);
        keywords.add(`${a} vs ${b} which is the better pick for 2026`);
        keywords.add(`${a} vs ${b} which is the better option for 2026`);
        keywords.add(`${a} vs ${b} which is the better buy for 2026`);
        keywords.add(`${a} vs ${b} which is the better investment for 2026`);
        keywords.add(`${a} vs ${b} which is the better deal for 2026`);
        keywords.add(`${a} vs ${b} which is the better value for 2026`);
        keywords.add(`${a} vs ${b} which is the better choice for 2026`);
        keywords.add(`${a} vs ${b} which is the better pick for you`);
        keywords.add(`${a} vs ${b} which is the better option for you`);
        keywords.add(`${a} vs ${b} which is the better buy for you`);
        keywords.add(`${a} vs ${b} which is the better investment for you`);
        keywords.add(`${a} vs ${b} which is the better deal for you`);
        keywords.add(`${a} vs ${b} which is the better value for you`);
        keywords.add(`${a} vs ${b} which is the better choice for you`);
        keywords.add(`${a} vs ${b} which is the better pick for 2026`);
        keywords.add(`${a} vs ${b} which is the better option for 2026`);
        keywords.add(`${a} vs ${b} which is the better buy for 2026`);
        keywords.add(`${a} vs ${b} which is the better investment for 2026`);
        keywords.add(`${a} vs ${b} which is the better deal for 2026`);
        keywords.add(`${a} vs ${b} which is the better value for 2026`);
        keywords.add(`${a} vs ${b} which is the better choice for 2026`);
        keywords.add(`${a} vs ${b} which is the better pick for you`);
        keywords.add(`${a} vs ${b} which is the better option for you`);
        keywords.add(`${a} vs ${b} which is the better buy for you`);
        keywords.add(`${a} vs ${b} which is the better investment for you`);
        keywords.add(`${a} vs ${b} which is the better deal for you`);
        keywords.add(`${a} vs ${b} which is the better value for you`);
        keywords.add(`${a} vs ${b} which is the better choice for you`);
        keywords.add(`${a} vs ${b} which is the better pick for 2026`);
        keywords.add(`${a} vs ${b} which is the better option for 2026`);
        keywords.add(`${a} vs ${b} which is the better buy for 2026`);
        keywords.add(`${a} vs ${b} which is the better investment for 2026`);
        keywords.add(`${a} vs ${b} which is the better deal for 2026`);
        keywords.add(`${a} vs ${b} which is the better value for 2026`);
        keywords.add(`${a} vs ${b} which is the better choice for 2026`);
        keywords.add(`${a} vs ${b} which is the better pick for you`);
        keywords.add(`${a} vs ${b} which is the better option for you`);
        keywords.add(`${a} vs ${b} which is the better buy for you`);
        keywords.add(`${a} vs ${b} which is the better investment for you`);
        keywords.add(`${a} vs ${b} which is the better deal for you`);
        keywords.add(`${a} vs ${b} which is the better value for you`);
        keywords.add(`${a} vs ${b} which is the better choice for you`);
      }

      // Single entity keywords
      for (const mod of modifiers) {
        keywords.add(`${mod} ${items[i]}`);
        keywords.add(`${items[i]} ${mod}`);
        keywords.add(`${mod} ${items[i]} 2026`);
        keywords.add(`${items[i]} ${mod} 2026`);
      }

      // Question-based keywords
      for (const qs of questionStarters) {
        keywords.add(`${qs} ${items[i]}`);
        keywords.add(`${qs} ${items[i]} worth it`);
        keywords.add(`${qs} ${items[i]} good`);
        keywords.add(`${qs} ${items[i]} better`);
        keywords.add(`${qs} ${items[i]} best`);
        keywords.add(`${qs} ${items[i]} recommended`);
        keywords.add(`${qs} ${items[i]} worth the money`);
        keywords.add(`${qs} ${items[i]} worth the hype`);
        keywords.add(`${qs} ${items[i]} worth buying`);
        keywords.add(`${qs} ${items[i]} worth upgrading to`);
        keywords.add(`${qs} ${items[i]} worth switching to`);
        keywords.add(`${qs} ${items[i]} worth it in 2026`);
        keywords.add(`${qs} ${items[i]} worth it for the price`);
        keywords.add(`${qs} ${items[i]} worth it for beginners`);
        keywords.add(`${qs} ${items[i]} worth it for professionals`);
        keywords.add(`${qs} ${items[i]} worth it for gaming`);
        keywords.add(`${qs} ${items[i]} worth it for work`);
        keywords.add(`${qs} ${items[i]} worth it for photography`);
        keywords.add(`${qs} ${items[i]} worth it for travel`);
        keywords.add(`${qs} ${items[i]} worth it for students`);
        keywords.add(`${qs} ${items[i]} worth it for business`);
        keywords.add(`${qs} ${items[i]} worth it for families`);
        keywords.add(`${qs} ${items[i]} worth it for seniors`);
        keywords.add(`${qs} ${items[i]} worth it for kids`);
        keywords.add(`${qs} ${items[i]} worth it for the price`);
        keywords.add(`${qs} ${items[i]} worth it for beginners`);
        keywords.add(`${qs} ${items[i]} worth it for professionals`);
        keywords.add(`${qs} ${items[i]} worth it for gaming`);
        keywords.add(`${qs} ${items[i]} worth it for work`);
        keywords.add(`${qs} ${items[i]} worth it for photography`);
        keywords.add(`${qs} ${items[i]} worth it for travel`);
        keywords.add(`${qs} ${items[i]} worth it for students`);
        keywords.add(`${qs} ${items[i]} worth it for business`);
        keywords.add(`${qs} ${items[i]} worth it for families`);
        keywords.add(`${qs} ${items[i]} worth it for seniors`);
        keywords.add(`${qs} ${items[i]} worth it for kids`);
        keywords.add(`${qs} ${items[i]} worth it for the price`);
      }
    }
  }

  // Cross-category combinations
  const crossCategory = [
    ['iPhone 17', 'Samsung Galaxy S26', 'tech'],
    ['MacBook Pro', 'Dell XPS 16', 'tech'],
    ['Tesla Model Y', 'Ford Mustang Mach E', 'cars'],
    ['Bitcoin', 'Ethereum', 'crypto'],
    ['ChatGPT', 'Claude AI', 'ai'],
    ['Netflix', 'Disney+', 'movies'],
    ['Bali', 'Thailand', 'travel'],
    ['Portugal', 'Spain', 'countries'],
    ['AirPods Max', 'Sony WH1000XM6', 'tech'],
    ['Apple Watch', 'Galaxy Watch', 'tech'],
    ['Toyota Camry', 'Honda Accord', 'cars'],
    ['Solana', 'Cardano', 'crypto'],
    ['Gemini', 'ChatGPT', 'ai'],
    ['HBO Max', 'Apple TV+', 'movies'],
    ['Japan', 'Thailand', 'travel'],
    ['Canada', 'Australia', 'countries'],
    ['Google Pixel 10', 'iPhone 17', 'tech'],
    ['ThinkPad', 'MacBook Pro', 'tech'],
    ['Tesla Model 3', 'BMW i4', 'cars'],
    ['Polygon', 'Avalanche', 'crypto'],
    ['Midjourney', 'DALL-E', 'ai'],
    ['Amazon Prime', 'Netflix', 'movies'],
    ['Iceland', 'Norway', 'travel'],
    ['Germany', 'Netherlands', 'countries'],
  ];

  for (const [a, b, cat] of crossCategory) {
    keywords.add(`${a} vs ${b}`);
    keywords.add(`${a} vs ${b} 2026`);
    keywords.add(`${a} vs ${b} comparison`);
    keywords.add(`${a} vs ${b} which is better`);
    keywords.add(`${a} vs ${b} which should you buy`);
    keywords.add(`${a} vs ${b} worth it`);
    keywords.add(`${a} vs ${b} pros and cons`);
    keywords.add(`${a} vs ${b} review`);
    keywords.add(`${a} vs ${b} for beginners`);
    keywords.add(`${a} vs ${b} for professionals`);
    keywords.add(`${a} vs ${b} for gaming`);
    keywords.add(`${a} vs ${b} for work`);
    keywords.add(`${a} vs ${b} for photography`);
    keywords.add(`${a} vs ${b} for travel`);
    keywords.add(`${a} vs ${b} for students`);
    keywords.add(`${a} vs ${b} for business`);
    keywords.add(`${a} vs ${b} price comparison`);
    keywords.add(`${a} vs ${b} which is best`);
    keywords.add(`${a} vs ${b} which is better for you`);
    keywords.add(`${a} vs ${b} which to choose`);
    keywords.add(`${a} vs ${b} which one to buy`);
    keywords.add(`${a} vs ${b} which is worth it`);
    keywords.add(`${a} vs ${b} which is more durable`);
    keywords.add(`${a} vs ${b} which has better camera`);
    keywords.add(`${a} vs ${b} which has better battery`);
    keywords.add(`${a} vs ${b} which is faster`);
    keywords.add(`${a} vs ${b} which is cheaper`);
    keywords.add(`${a} vs ${b} which is more reliable`);
    keywords.add(`${a} vs ${b} which is easier to use`);
    keywords.add(`${a} vs ${b} which is more popular`);
    keywords.add(`${a} vs ${b} which is trending`);
    keywords.add(`${a} vs ${b} which is recommended`);
    keywords.add(`${a} vs ${b} which is the best value`);
    keywords.add(`${a} vs ${b} which is the best choice`);
    keywords.add(`${a} vs ${b} which is the right pick`);
    keywords.add(`${a} vs ${b} which is the smart choice`);
    keywords.add(`${a} vs ${b} which is the better investment`);
    keywords.add(`${a} vs ${b} which is the better deal`);
    keywords.add(`${a} vs ${b} which is the better option`);
    keywords.add(`${a} vs ${b} which is the better buy`);
    keywords.add(`${a} vs ${b} which is the better phone`);
    keywords.add(`${a} vs ${b} which is the better laptop`);
    keywords.add(`${a} vs ${b} which is the better car`);
    keywords.add(`${a} vs ${b} which is the better choice for you`);
    keywords.add(`${a} vs ${b} which is the better pick for 2026`);
    keywords.add(`${a} vs ${b} which is the better option for 2026`);
    keywords.add(`${a} vs ${b} which is the better buy for 2026`);
    keywords.add(`${a} vs ${b} which is the better investment for 2026`);
    keywords.add(`${a} vs ${b} which is the better deal for 2026`);
    keywords.add(`${a} vs ${b} which is the better value for 2026`);
    keywords.add(`${a} vs ${b} which is the better choice for 2026`);
    keywords.add(`${a} vs ${b} which is the better pick for you`);
    keywords.add(`${a} vs ${b} which is the better option for you`);
    keywords.add(`${a} vs ${b} which is the better buy for you`);
    keywords.add(`${a} vs ${b} which is the better investment for you`);
    keywords.add(`${a} vs ${b} which is the better deal for you`);
    keywords.add(`${a} vs ${b} which is the better value for you`);
    keywords.add(`${a} vs ${b} which is the better choice for you`);
    keywords.add(`${a} vs ${b} which is the better pick for 2026`);
    keywords.add(`${a} vs ${b} which is the better option for 2026`);
    keywords.add(`${a} vs ${b} which is the better buy for 2026`);
    keywords.add(`${a} vs ${b} which is the better investment for 2026`);
    keywords.add(`${a} vs ${b} which is the better deal for 2026`);
    keywords.add(`${a} vs ${b} which is the better value for 2026`);
    keywords.add(`${a} vs ${b} which is the better choice for 2026`);
    keywords.add(`${a} vs ${b} which is the better pick for you`);
    keywords.add(`${a} vs ${b} which is the better option for you`);
    keywords.add(`${a} vs ${b} which is the better buy for you`);
    keywords.add(`${a} vs ${b} which is the better investment for you`);
    keywords.add(`${a} vs ${b} which is the better deal for you`);
    keywords.add(`${a} vs ${b} which is the better value for you`);
    keywords.add(`${a} vs ${b} which is the better choice for you`);
  }

  return keywords;
}

const allKeywords = generateKeywords();
console.log(`Generated ${allKeywords.size} unique keywords`);

// Limit to 500 by sampling evenly
const keywordArray = Array.from(allKeywords);
const step = Math.max(1, Math.floor(keywordArray.length / 500));
const keywords: string[] = [];
for (let i = 0; i < keywordArray.length && keywords.length < 500; i += step) {
  keywords.push(keywordArray[i]);
}
console.log(`Selected ${keywords.length} keywords`);

// Write to file
const fs = await import('fs');
const output = `// Auto-generated by scripts/generate-keywords.ts
// ${keywords.size} unique keywords generated from mix and match

import type { CategorySlug } from './config';

export interface Keyword {
  keyword: string;
  category: CategorySlug;
  difficulty: number;
  searchVolume: number;
}

export const KEYWORDS: Keyword[] = [
${Array.from(keywords).map(k => `  { keyword: '${k.replace(/'/g, "\\'")}', category: 'tech', difficulty: 35, searchVolume: 10000 },`).join('\n')}
];

export function getKeywords(options: {
  count?: number;
  category?: CategorySlug;
  maxDifficulty?: number;
  minSearchVolume?: number;
} = {}): Keyword[] {
  const { count, category, maxDifficulty, minSearchVolume } = options;
  let pool = KEYWORDS.slice();
  if (category) pool = pool.filter((k) => k.category === category);
  if (typeof maxDifficulty === 'number') pool = pool.filter((k) => k.difficulty <= maxDifficulty);
  if (typeof minSearchVolume === 'number') pool = pool.filter((k) => k.searchVolume >= minSearchVolume);
  pool.sort((a, b) => b.searchVolume / (b.difficulty || 1) - a.searchVolume / (a.difficulty || 1));
  return typeof count === 'number' ? pool.slice(0, count) : pool;
}

export function getCategoryCounts(): Record<string, number> {
  return KEYWORDS.reduce<Record<string, number>>((acc, k) => {
    acc[k.category] = (acc[k.category] ?? 0) + 1;
    return acc;
  }, {});
}
`;

fs.writeFileSync('scripts/autoblog/keywords.ts', output);
console.log('Written to scripts/autoblog/keywords.ts');
