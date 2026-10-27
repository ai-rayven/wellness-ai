import type { IsoDate } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar day in `YYYY-MM-DD` form (rejects e.g. `2026-02-30`). */
export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** The local calendar day of `date`. */
export function toIsoDate(date: Date): IsoDate {
  if (Number.isNaN(date.getTime())) throw new RangeError('date is invalid');

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Full years between `birthDate` and `today`. */
export function ageOn(birthDate: IsoDate, today: IsoDate): number {
  if (!isIsoDate(birthDate)) throw new RangeError(`birthDate must be YYYY-MM-DD, got "${birthDate}"`);
  if (!isIsoDate(today)) throw new RangeError(`today must be YYYY-MM-DD, got "${today}"`);
  if (birthDate > today) throw new RangeError('birthDate is after today');

  const years = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  const hadBirthday = today.slice(5) >= birthDate.slice(5);
  return hadBirthday ? years : years - 1;
}

function parseIsoDate(value: IsoDate): Date {
  if (!isIsoDate(value)) throw new RangeError(`date must be YYYY-MM-DD, got "${value}"`);
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** The day `days` after `date` (negative for earlier days). */
export function addDays(date: IsoDate, days: number): IsoDate {
  if (!Number.isInteger(days)) throw new RangeError('days must be a whole number');

  const result = parseIsoDate(date);
  result.setDate(result.getDate() + days);
  return toIsoDate(result);
}

/** "Today", "Yesterday", or e.g. "Tue, Oct 20". */
export function formatDay(date: IsoDate, today: IsoDate): string {
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  return parseIsoDate(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
