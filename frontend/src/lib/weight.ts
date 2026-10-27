import type { WeightEntry } from './types';

export const MIN_WEIGHT_LB = 50;
export const MAX_WEIGHT_LB = 1000;

/** The weight to store, rounded to 0.1 lb, or null when it is out of range. */
export function parseWeightLb(text: string): number | null {
  const value = Number(text);
  if (!text.trim() || !Number.isFinite(value)) return null;
  if (value < MIN_WEIGHT_LB || value > MAX_WEIGHT_LB) return null;
  return Math.round(value * 10) / 10;
}

/** Each entry with the change from the entry before it. `entries` must be sorted by date. */
export function withChanges(entries: readonly WeightEntry[]): { entry: WeightEntry; changeLb: number | null }[] {
  entries.forEach((e, i) => {
    if (i > 0 && e.date <= entries[i - 1].date) throw new RangeError('entries must be sorted by date, one per day');
  });

  return entries.map((entry, i) => ({
    entry,
    changeLb: i === 0 ? null : Math.round((entry.weightLb - entries[i - 1].weightLb) * 10) / 10,
  }));
}
