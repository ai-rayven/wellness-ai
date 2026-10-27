import { describe, expect, it } from '@jest/globals';

import { addDays, ageOn, daysFrom, formatDay, isIsoDate, toIsoDate, weekStart } from './dates';

describe('isIsoDate', () => {
  it.each(['2026-10-26', '2024-02-29'])('accepts %p', (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '26-10-26', '2026-1-5', ''])('rejects %p', (value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});

describe('toIsoDate', () => {
  it('uses the local calendar day', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('rejects an invalid date', () => {
    expect(() => toIsoDate(new Date('nope'))).toThrow(RangeError);
  });
});

describe('ageOn', () => {
  it('counts full years', () => {
    expect(ageOn('1990-06-15', '2026-06-14')).toBe(35);
    expect(ageOn('1990-06-15', '2026-06-15')).toBe(36);
  });

  it('is 0 on the day of birth', () => {
    expect(ageOn('2026-10-26', '2026-10-26')).toBe(0);
  });

  it('rejects a birth date after today and invalid dates', () => {
    expect(() => ageOn('2026-10-27', '2026-10-26')).toThrow('after today');
    expect(() => ageOn('1990-02-30', '2026-10-26')).toThrow(RangeError);
  });
});

describe('addDays', () => {
  it('moves across months and years', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('rejects a fractional number of days', () => {
    expect(() => addDays('2026-10-26', 0.5)).toThrow(RangeError);
  });
});

describe('formatDay', () => {
  it('names today and yesterday', () => {
    expect(formatDay('2026-10-26', '2026-10-26')).toBe('Today');
    expect(formatDay('2026-10-25', '2026-10-26')).toBe('Yesterday');
  });

  it('shows other days with weekday, month and day', () => {
    expect(formatDay('2026-10-20', '2026-10-26')).toBe('Tue, Oct 20');
  });
});

describe('weekStart', () => {
  it('is the Monday of the week', () => {
    expect(weekStart('2026-10-26')).toBe('2026-10-26'); // Monday
    expect(weekStart('2026-11-01')).toBe('2026-10-26'); // Sunday
    expect(weekStart('2026-10-28')).toBe('2026-10-26');
  });
});

describe('daysFrom', () => {
  it('lists the days in order', () => {
    expect(daysFrom('2026-10-30', 3)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
    expect(daysFrom('2026-10-30', 0)).toEqual([]);
  });
});
