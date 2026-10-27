import { describe, expect, it } from '@jest/globals';
import { nutrientsForGrams, remainingNutrients, sumNutrients, summarizeDay } from './nutrients';
import type { LogEntry, Nutrients } from './types';

// Per-100 g values from the mock Edamam data in docs/mvp.js.
const OATS: Nutrients = { kcal: 379, proteinG: 13.2, carbsG: 67.7, fatG: 6.5 };
const CHICKEN: Nutrients = { kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 };
const TARGETS: Nutrients = { kcal: 2200, proteinG: 150, carbsG: 220, fatG: 70 };

function entry(id: string, date: string, nutrients: Nutrients): LogEntry {
  return {
    id,
    date,
    meal: 'lunch',
    foodId: 'edamam_x',
    food: { name: 'x', brand: '', nutrientsPer100g: nutrients },
    grams: 100,
    nutrients,
  };
}

describe('nutrientsForGrams', () => {
  it('scales per-100 g values and rounds kcal to 1 and macros to 0.1 g', () => {
    expect(nutrientsForGrams(OATS, 60)).toEqual({ kcal: 227, proteinG: 7.9, carbsG: 40.6, fatG: 3.9 });
  });

  it('returns the per-100 g values for 100 g', () => {
    expect(nutrientsForGrams(CHICKEN, 100)).toEqual(CHICKEN);
  });

  it.each([0, -5, NaN, Infinity])('rejects %p grams', (grams) => {
    expect(() => nutrientsForGrams(OATS, grams)).toThrow(RangeError);
  });

  it('rejects non-finite nutrient values', () => {
    expect(() => nutrientsForGrams({ ...OATS, fatG: NaN }, 100)).toThrow('per100g.fatG');
  });
});

describe('sumNutrients', () => {
  it('returns zero for no entries', () => {
    expect(sumNutrients([])).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it('adds values without floating point drift', () => {
    const tenth: Nutrients = { kcal: 1, proteinG: 0.1, carbsG: 0.2, fatG: 0.7 };
    expect(sumNutrients([tenth, tenth, tenth])).toEqual({ kcal: 3, proteinG: 0.3, carbsG: 0.6, fatG: 2.1 });
  });

  it('names the bad item', () => {
    expect(() => sumNutrients([OATS, { ...OATS, kcal: NaN }])).toThrow('list[1].kcal');
  });
});

describe('remainingNutrients', () => {
  it('subtracts totals from targets', () => {
    const totals = { kcal: 1800.4, proteinG: 120.25, carbsG: 200, fatG: 50 };
    expect(remainingNutrients(totals, TARGETS)).toEqual({ kcal: 400, proteinG: 29.8, carbsG: 20, fatG: 20 });
  });

  it('goes negative when a target is exceeded', () => {
    const totals = { ...TARGETS, kcal: 2500 };
    expect(remainingNutrients(totals, TARGETS).kcal).toBe(-300);
  });
});

describe('summarizeDay', () => {
  it('totals the entries of the day', () => {
    const entries = [entry('a', '2026-10-26', OATS), entry('b', '2026-10-26', CHICKEN)];
    const summary = summarizeDay('2026-10-26', entries);
    expect(summary.date).toBe('2026-10-26');
    expect(summary.entries).toEqual(entries);
    expect(summary.totals).toEqual({ kcal: 544, proteinG: 44.2, carbsG: 67.7, fatG: 10.1 });
  });

  it('accepts a day with no entries', () => {
    expect(summarizeDay('2026-10-26', []).totals.kcal).toBe(0);
  });

  it('rejects an entry from another day', () => {
    expect(() => summarizeDay('2026-10-26', [entry('a', '2026-10-25', OATS)])).toThrow('entry a is for 2026-10-25');
  });

  it.each(['2026-02-30', '26-10-26', '2026-1-5', ''])('rejects the date %p', (date) => {
    expect(() => summarizeDay(date, [])).toThrow(RangeError);
  });
});
