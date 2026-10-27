import { describe, expect, it } from '@jest/globals';

import { ageOn, isIsoDate, toIsoDate } from './dates';

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
