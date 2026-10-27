import { describe, expect, it } from '@jest/globals';

import { isScreenshotPath } from './screenshots';

const FILE = '0b4c5e2a-7f1d-4c3b-9a8e-2d6f1b0c9e7a.jpg';

describe('isScreenshotPath', () => {
  it('accepts a screenshot of the caller', () => {
    expect(isScreenshotPath(`issues/alice/${FILE}`, 'alice')).toBe(true);
  });

  it.each([
    `issues/bob/${FILE}`,
    `issues/alice/${FILE}/x`,
    `issues/alice/../bob/${FILE}`,
    'issues/alice/photo.png',
    `users/alice/${FILE}`,
    42,
    undefined,
  ])('rejects %p', (path) => {
    expect(isScreenshotPath(path, 'alice')).toBe(false);
  });

  it('rejects an empty uid', () => {
    expect(() => isScreenshotPath(`issues//${FILE}`, '')).toThrow(RangeError);
  });
});
