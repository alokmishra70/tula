export interface MatchableDish {
  id: string;
  name: string;
  aliases: readonly string[];
}

export interface DishMatch<T extends MatchableDish> {
  dish: T;
  score: number;
}

export const DISH_MATCH_THRESHOLD = 0.45;

export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Word trigrams padded like pg_trgm: two leading spaces, one trailing. */
export function trigrams(text: string): Set<string> {
  const grams = new Set<string>();
  for (const word of normalizeFoodName(text).split(' ').filter(Boolean)) {
    const padded = `  ${word} `;
    for (let i = 0; i <= padded.length - 3; i++) grams.add(padded.slice(i, i + 3));
  }
  return grams;
}

export function trigramSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared++;
  return shared / (a.size + b.size - shared);
}

export class DishMatcher<T extends MatchableDish> {
  private readonly index: Array<{ dish: T; normalized: string; grams: Set<string> }>;

  constructor(
    dishes: readonly T[],
    private readonly threshold = DISH_MATCH_THRESHOLD,
  ) {
    this.index = dishes.flatMap((dish) =>
      [dish.name, ...dish.aliases].map((label) => ({
        dish,
        normalized: normalizeFoodName(label),
        grams: trigrams(label),
      })),
    );
  }

  match(itemName: string): DishMatch<T> | null {
    const normalized = normalizeFoodName(itemName);
    if (!normalized) return null;

    const exact = this.index.find((entry) => entry.normalized === normalized);
    if (exact) return { dish: exact.dish, score: 1 };

    const grams = trigrams(normalized);
    let best: DishMatch<T> | null = null;
    for (const entry of this.index) {
      const score = trigramSimilarity(grams, entry.grams);
      if (!best || score > best.score) best = { dish: entry.dish, score };
    }
    return best && best.score >= this.threshold ? best : null;
  }
}
