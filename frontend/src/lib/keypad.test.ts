import { describe, expect, it } from '@jest/globals';

import { pressKey, type Key } from './keypad';

const LIMITS = { whole: 4, decimals: 1 };
const type = (keys: Key[]) => keys.reduce((text, key) => pressKey(text, key, LIMITS), '');

describe('pressKey', () => {
  it('types a decimal number', () => {
    expect(type(['1', '8', '3', '.', '4'])).toBe('183.4');
  });

  it('removes the last character with backspace', () => {
    expect(type(['1', '8', '.', 'backspace', 'backspace'])).toBe('1');
    expect(type(['backspace'])).toBe('');
  });

  it('keeps one decimal point, with a 0 before a first point', () => {
    expect(type(['.', '5', '.'])).toBe('0.5');
  });

  it('replaces a leading 0', () => {
    expect(type(['0', '7'])).toBe('7');
  });

  it('ignores digits past the limits', () => {
    expect(type(['1', '2', '3', '4', '5'])).toBe('1234');
    expect(type(['1', '.', '2', '3'])).toBe('1.2');
  });

  it('ignores the point when no decimals are allowed', () => {
    expect(pressKey('12', '.', { whole: 4, decimals: 0 })).toBe('12');
  });

  it.each([
    { whole: 0, decimals: 1 },
    { whole: 4, decimals: -1 },
    { whole: 1.5, decimals: 1 },
  ])('rejects the limits %p', (limits) => {
    expect(() => pressKey('', '1', limits)).toThrow(RangeError);
  });
});
