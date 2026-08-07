import fs from 'node:fs';
import path from 'node:path';
import {
  CATEGORIES,
  CATEGORY_SLUGS,
  PAIRING_CONFIG,
  PATHS,
  type CategorySlug,
} from './config';
import { entitySchema, type Entity } from './validate';

export interface Pair {
  slug: string;
  category: CategorySlug;
  a: Entity;
  b: Entity;
  priority: number;
  reasons: string[];
}

export interface PairOptions {
  count?: number;
  category?: CategorySlug;
  minPriority?: number;
  excludeSlugs?: Set<string>;
}

const entityCache = new Map<CategorySlug, Entity[]>();

export function loadEntities(category: CategorySlug): Entity[] {
  const cached = entityCache.get(category);
  if (cached) return cached;

  const entities: Entity[] = [];

  for (const file of CATEGORIES[category].files) {
    const filePath = path.join(PATHS.entitiesDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Entity file not found: ${filePath}`);
    }

    const raw: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(raw)) {
      throw new Error(`Entity file must contain an array: ${file}`);
    }

    raw.forEach((item, index) => {
      const parsed = entitySchema.safeParse(item);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
          .join('; ');
        throw new Error(`Invalid entity in ${file}[${index}]: ${issues}`);
      }
      entities.push(parsed.data);
    });
  }

  const seen = new Set<string>();
  for (const entity of entities) {
    if (seen.has(entity.id)) {
      throw new Error(`Duplicate entity id "${entity.id}" in category "${category}"`);
    }
    seen.add(entity.id);
  }

  entityCache.set(category, entities);
  return entities;
}

export function loadAllEntities(): Entity[] {
  return CATEGORY_SLUGS.flatMap((slug) => loadEntities(slug));
}

export function pairSlug(a: Entity, b: Entity): string {
  return `${a.id}-vs-${b.id}`;
}

function dedupeKey(a: Entity, b: Entity): string {
  return [a.id, b.id].sort().join('::');
}

function isComparable(a: Entity, b: Entity, category: CategorySlug): boolean {
  if (a.id === b.id) return false;
  if (a.subcategory !== b.subcategory) return false;
  if (Math.abs(a.tier - b.tier) > PAIRING_CONFIG.maxTierGap) return false;
  if (CATEGORIES[category].crossBrandOnly && a.brand === b.brand) return false;
  return true;
}

function scorePair(a: Entity, b: Entity): { priority: number; reasons: string[] } {
  const reasons: string[] = [];

  const demand = Math.sqrt(a.searchVolume * b.searchVolume);
  let priority = Math.round(Math.log10(Math.max(demand, 10)) * 20);
  reasons.push(`demand=${Math.round(demand).toLocaleString('en-US')}`);

  const tierGap = Math.abs(a.tier - b.tier);
  if (tierGap === 0) {
    priority += 20;
    reasons.push('same-tier');
  } else if (tierGap === 1) {
    priority += 8;
    reasons.push('adjacent-tier');
  } else {
    priority -= PAIRING_CONFIG.tierMismatchPenalty;
    reasons.push('tier-mismatch');
  }

  if (a.brand === b.brand) {
    priority -= PAIRING_CONFIG.sameBrandPenalty;
    reasons.push('same-brand');
  } else {
    priority += PAIRING_CONFIG.crossBrandBonus;
    reasons.push('cross-brand');
  }

  const yearGap = Math.abs(a.releaseYear - b.releaseYear);
  if (yearGap <= 1) {
    priority += 10;
    reasons.push('same-generation');
  } else if (yearGap >= 4) {
    priority -= 15;
    reasons.push('generation-gap');
  }

  const scoreGap = Math.abs(a.score - b.score);
  if (scoreGap <= 0.5) {
    priority += 12;
    reasons.push('close-match');
  } else if (scoreGap > 1.5) {
    priority -= 10;
    reasons.push('lopsided');
  }

  return { priority, reasons };
}

export function generatePairs(options: PairOptions = {}): Pair[] {
  const categories = options.category ? [options.category] : [...CATEGORY_SLUGS];
  const minPriority = options.minPriority ?? PAIRING_CONFIG.minPriority;
  const excludeSlugs = options.excludeSlugs ?? new Set<string>();

  const seen = new Set<string>();
  const pairs: Pair[] = [];

  for (const category of categories) {
    const entities = loadEntities(category);

    for (let i = 0; i < entities.length; i += 1) {
      for (let j = i + 1; j < entities.length; j += 1) {
        const first = entities[i];
        const second = entities[j];

        if (!isComparable(first, second, category)) continue;

        const key = dedupeKey(first, second);
        if (seen.has(key)) continue;
        seen.add(key);

        const [a, b] =
          first.searchVolume >= second.searchVolume ? [first, second] : [second, first];

        const slug = pairSlug(a, b);
        if (excludeSlugs.has(slug)) continue;

        const { priority, reasons } = scorePair(a, b);
        if (priority < minPriority) continue;

        pairs.push({ slug, category, a, b, priority, reasons });
      }
    }
  }

  pairs.sort((x, y) =>
    y.priority !== x.priority ? y.priority - x.priority : x.slug.localeCompare(y.slug)
  );

  return typeof options.count === 'number' ? pairs.slice(0, options.count) : pairs;
}

export function findRelatedPairs(pair: Pair, pool: Pair[], count: number): Pair[] {
  return pool
    .filter((candidate) => candidate.slug !== pair.slug)
    .map((candidate) => {
      const sharesEntity =
        candidate.a.id === pair.a.id ||
        candidate.a.id === pair.b.id ||
        candidate.b.id === pair.a.id ||
        candidate.b.id === pair.b.id;

      let affinity = candidate.priority / 100;
      if (sharesEntity) affinity += 3;
      if (candidate.a.subcategory === pair.a.subcategory) affinity += 2;
      else if (candidate.category === pair.category) affinity += 1;

      return { candidate, affinity };
    })
    .sort((x, y) => y.affinity - x.affinity)
    .slice(0, count)
    .map((entry) => entry.candidate);
}
