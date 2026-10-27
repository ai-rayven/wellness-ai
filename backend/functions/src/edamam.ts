// Edamam Food Database API v2: https://developer.edamam.com/food-database-api-docs
// The only place that knows Edamam's request and response shapes.
import { foodId, type Food } from './food';

const PARSER_URL = 'https://api.edamam.com/api/food-database/v2/parser';
const SOURCE = 'edamam';

export interface EdamamCredentials {
  appId: string;
  appKey: string;
}

interface EdamamFood {
  foodId?: unknown;
  label?: unknown;
  brand?: unknown;
  nutrients?: Record<string, unknown>;
}

interface EdamamResponse {
  hints?: { food?: EdamamFood }[];
}

export class EdamamError extends Error {}

export async function searchEdamam(query: string, credentials: EdamamCredentials): Promise<Food[]> {
  if (!query.trim()) throw new RangeError('query must not be empty');
  if (!credentials.appId || !credentials.appKey) throw new RangeError('Edamam credentials are missing');

  const url = new URL(PARSER_URL);
  url.search = new URLSearchParams({
    app_id: credentials.appId,
    app_key: credentials.appKey,
    ingr: query,
    'nutrition-type': 'logging',
  }).toString();

  const response = await fetch(url);
  if (!response.ok) throw new EdamamError(`Edamam answered ${response.status}`);
  return toFoods((await response.json()) as EdamamResponse);
}

/** Maps a parser response to foods. Hints without an id, a name or calories are skipped. */
export function toFoods(response: EdamamResponse): Food[] {
  const seen = new Set<string>();
  const foods: Food[] = [];
  for (const hint of response.hints ?? []) {
    const food = hint.food && toFood(hint.food);
    if (!food || seen.has(food.id)) continue;
    seen.add(food.id);
    foods.push(food);
  }
  return foods;
}

function toFood(raw: EdamamFood): Food | null {
  const n = raw.nutrients ?? {};
  if (typeof raw.foodId !== 'string' || !raw.foodId) return null;
  if (typeof raw.label !== 'string' || !raw.label.trim()) return null;
  if (!isAmount(n.ENERC_KCAL)) return null;

  // Edamam leaves out a nutrient when the food has none of it.
  const grams = (value: unknown) => (isAmount(value) ? value : 0);
  return {
    id: foodId(SOURCE, raw.foodId),
    name: raw.label.trim(),
    brand: typeof raw.brand === 'string' ? raw.brand.trim() : '',
    nutrientsPer100g: {
      kcal: n.ENERC_KCAL,
      proteinG: grams(n.PROCNT),
      carbsG: grams(n.CHOCDF),
      fatG: grams(n.FAT),
    },
    metadata: { source: SOURCE, lookupId: raw.foodId },
  };
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
