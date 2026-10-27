// Nutrient math, rounded like the stored values: kcal to a whole number, macros to 0.1 g.
import { isIsoDate } from './dates';
import type { DailySummary, IsoDate, LogEntry, Nutrients } from './types';

type NutrientKey = keyof Nutrients;

/** The nutrients in display order, with their names and units. */
export const NUTRIENTS: readonly { key: NutrientKey; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'proteinG', label: 'Protein', unit: 'g' },
  { key: 'carbsG', label: 'Carbs', unit: 'g' },
  { key: 'fatG', label: 'Fat', unit: 'g' },
];

/** Protein, carbs and fat. */
export const MACROS = NUTRIENTS.slice(1);

const KEYS = NUTRIENTS.map((n) => n.key);

const ZERO_NUTRIENTS: Nutrients = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };

function build(value: (key: NutrientKey) => number): Nutrients {
  return { kcal: value('kcal'), proteinG: value('proteinG'), carbsG: value('carbsG'), fatG: value('fatG') };
}

function round(n: Nutrients): Nutrients {
  return build((key) => (key === 'kcal' ? Math.round(n.kcal) : Math.round(n[key] * 10) / 10));
}

function assertNutrients(n: Nutrients, name: string): void {
  for (const key of KEYS) {
    if (!Number.isFinite(n[key])) throw new TypeError(`${name}.${key} must be a finite number`);
  }
}

/** Totals for `grams` of a food: `per100g × grams / 100`. */
export function nutrientsForGrams(per100g: Nutrients, grams: number): Nutrients {
  assertNutrients(per100g, 'per100g');
  if (!Number.isFinite(grams) || grams <= 0) throw new RangeError('grams must be a positive number');

  const factor = grams / 100;
  return round(build((key) => per100g[key] * factor));
}

export function sumNutrients(list: readonly Nutrients[]): Nutrients {
  list.forEach((n, i) => assertNutrients(n, `list[${i}]`));

  const total = list.reduce((t, n) => build((key) => t[key] + n[key]), ZERO_NUTRIENTS);
  return round(total);
}

/** `targets − totals`. Negative values mean the target is exceeded ("over"). */
export function remainingNutrients(totals: Nutrients, targets: Nutrients): Nutrients {
  assertNutrients(totals, 'totals');
  assertNutrients(targets, 'targets');

  return round(build((key) => targets[key] - totals[key]));
}

export function summarizeDay(date: IsoDate, entries: readonly LogEntry[]): DailySummary {
  if (!isIsoDate(date)) throw new RangeError(`date must be YYYY-MM-DD, got "${date}"`);
  const other = entries.find((e) => e.date !== date);
  if (other) throw new RangeError(`entry ${other.id} is for ${other.date}, not ${date}`);

  return {
    date,
    entries: [...entries],
    totals: sumNutrients(entries.map((e) => e.nutrients)),
  };
}
