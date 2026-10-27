import { describe, expect, it } from '@jest/globals';

import { isMealType, mealAt } from './meals';

describe('mealAt', () => {
  it.each([
    [7, 'breakfast'],
    [10, 'breakfast'],
    [11, 'lunch'],
    [15, 'dinner'],
    [20, 'dinner'],
    [21, 'snack'],
    [2, 'breakfast'],
  ])('at %p:00 is %p', (hour, meal) => {
    expect(mealAt(new Date(2026, 9, 26, hour))).toBe(meal);
  });
});

describe('isMealType', () => {
  it('accepts the 4 meals only', () => {
    expect(isMealType('lunch')).toBe(true);
    expect(isMealType('brunch')).toBe(false);
    expect(isMealType(undefined)).toBe(false);
  });
});
