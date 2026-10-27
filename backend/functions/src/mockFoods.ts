// Offline foods for the emulator when no Edamam keys are set. Same data as docs/mvp.js.
import { foodId, type Food } from './food';

const SOURCE = 'mock';

// name, brand, kcal / protein / carbs / fat per 100 g
const ROWS: [string, string, number, number, number, number][] = [
  ['Banana', '', 89, 1.1, 22.8, 0.3],
  ['Apple', '', 52, 0.3, 13.8, 0.2],
  ['Blueberries', '', 57, 0.7, 14.5, 0.3],
  ['Rolled oats', '', 379, 13.2, 67.7, 6.5],
  ['Rolled oats', 'Quaker', 375, 12.5, 68.8, 6.3],
  ['Egg, whole, raw', '', 143, 12.6, 0.7, 9.5],
  ['Chicken breast, cooked', '', 165, 31, 0, 3.6],
  ['Salmon, Atlantic, cooked', '', 206, 22.1, 0, 12.4],
  ['White rice, cooked', '', 130, 2.7, 28.2, 0.3],
  ['Brown rice, cooked', '', 123, 2.7, 25.6, 1],
  ['Greek yogurt, plain, nonfat', '', 59, 10.2, 3.6, 0.4],
  ['Greek yogurt, plain', 'Fage Total 0%', 54, 10.3, 3.8, 0],
  ['Peanut butter', '', 588, 25.1, 20, 50.4],
  ['Whole wheat bread', '', 252, 12.4, 42.7, 3.5],
  ['Broccoli, cooked', '', 35, 2.4, 7.2, 0.4],
  ['Avocado', '', 160, 2, 8.5, 14.7],
  ['Olive oil', '', 884, 0, 0, 100],
  ['Almonds', '', 579, 21.2, 21.6, 49.9],
  ['Whole milk', '', 61, 3.2, 4.8, 3.3],
  ['Protein bar, chocolate', 'Quest', 353, 35.3, 41.2, 13.7],
];

const MOCK_FOODS: Food[] = ROWS.map(([name, brand, kcal, proteinG, carbsG, fatG]) => {
  const lookupId = `${name} ${brand}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: foodId(SOURCE, lookupId),
    name,
    brand,
    nutrientsPer100g: { kcal, proteinG, carbsG, fatG },
    metadata: { source: SOURCE, lookupId },
  };
});

/** Foods whose name or brand contains every word of the query. */
export function searchMockFoods(query: string): Food[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) throw new RangeError('query must not be empty');

  return MOCK_FOODS.filter((food) => {
    const text = `${food.name} ${food.brand}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
