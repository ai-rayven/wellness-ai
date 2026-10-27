import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { EdamamError, searchEdamam, toFoods } from './edamam';

const CREDENTIALS = { appId: 'id-1', appKey: 'key-1' };

const BANANA = {
  foodId: 'food_banana',
  label: 'Banana ',
  nutrients: { ENERC_KCAL: 89, PROCNT: 1.09, CHOCDF: 22.84, FAT: 0.33 },
};

describe('toFoods', () => {
  it('maps a hint to a food', () => {
    expect(toFoods({ hints: [{ food: { ...BANANA, brand: 'Dole' } }] })).toEqual([
      {
        id: 'edamam_food_banana',
        name: 'Banana',
        brand: 'Dole',
        nutrientsPer100g: { kcal: 89, proteinG: 1.09, carbsG: 22.84, fatG: 0.33 },
        metadata: { source: 'edamam', lookupId: 'food_banana' },
      },
    ]);
  });

  it('uses 0 for missing macros and an empty brand', () => {
    const oil = { foodId: 'food_oil', label: 'Olive oil', nutrients: { ENERC_KCAL: 884, FAT: 100 } };
    const [food] = toFoods({ hints: [{ food: oil }] });
    expect(food.brand).toBe('');
    expect(food.nutrientsPer100g).toEqual({ kcal: 884, proteinG: 0, carbsG: 0, fatG: 100 });
  });

  it('skips hints without an id, a name or calories, and duplicates', () => {
    const hints = [
      { food: BANANA },
      { food: BANANA },
      { food: { ...BANANA, foodId: undefined } },
      { food: { ...BANANA, foodId: 'food_x', label: ' ' } },
      { food: { ...BANANA, foodId: 'food_y', nutrients: { PROCNT: 1 } } },
      {},
    ];
    expect(toFoods({ hints }).map((f) => f.id)).toEqual(['edamam_food_banana']);
  });

  it('returns no foods when there are no hints', () => {
    expect(toFoods({})).toEqual([]);
  });
});

describe('searchEdamam', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the query and credentials and maps the response', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ hints: [{ food: BANANA }] }));

    const foods = await searchEdamam('banana split', CREDENTIALS);

    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.edamam.com/api/food-database/v2/parser');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      app_id: 'id-1',
      app_key: 'key-1',
      ingr: 'banana split',
      'nutrition-type': 'logging',
    });
    expect(foods.map((f) => f.id)).toEqual(['edamam_food_banana']);
  });

  it('throws EdamamError when Edamam answers with an error', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('limit', { status: 429 }));
    await expect(searchEdamam('banana', CREDENTIALS)).rejects.toThrow(EdamamError);
  });

  it('rejects an empty query and missing credentials', async () => {
    await expect(searchEdamam(' ', CREDENTIALS)).rejects.toThrow(RangeError);
    await expect(searchEdamam('banana', { appId: '', appKey: 'k' })).rejects.toThrow(RangeError);
  });
});
