import { describe, expect, it } from '@jest/globals';

import { parseWeightLb, withChanges } from './weight';

describe('parseWeightLb', () => {
  it('rounds to 0.1 lb', () => {
    expect(parseWeightLb('183.46')).toBe(183.5);
    expect(parseWeightLb('180')).toBe(180);
  });

  it.each(['', ' ', 'abc', '49.9', '1000.1', 'Infinity'])('rejects %p', (text) => {
    expect(parseWeightLb(text)).toBeNull();
  });
});

describe('withChanges', () => {
  it('gives the change from the entry before, without float drift', () => {
    const entries = [
      { date: '2026-10-20', weightLb: 184.3 },
      { date: '2026-10-22', weightLb: 184.1 },
      { date: '2026-10-23', weightLb: 184.4 },
    ];
    expect(withChanges(entries).map((e) => e.changeLb)).toEqual([null, -0.2, 0.3]);
  });

  it('rejects unsorted or duplicate days', () => {
    const day = { date: '2026-10-20', weightLb: 180 };
    expect(() => withChanges([day, day])).toThrow(RangeError);
  });
});
