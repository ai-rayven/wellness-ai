import { describe, expect, it } from '@jest/globals';

import { DEFAULT_TARGETS, profileInputError, type ProfileInput } from './profile';

const TODAY = '2026-10-26';
const VALID: ProfileInput = { sex: 'female', birthDate: '1990-06-15', targets: DEFAULT_TARGETS };

describe('profileInputError', () => {
  it('accepts a complete profile', () => {
    expect(profileInputError(VALID, TODAY)).toBeNull();
  });

  it('asks for the sex first, then the birth date', () => {
    expect(profileInputError({}, TODAY)).toBe('Choose your sex.');
    expect(profileInputError({ sex: 'male' }, TODAY)).toBe('Enter your birth date.');
  });

  it('rejects a birth date that does not exist or is in the future', () => {
    expect(profileInputError({ ...VALID, birthDate: '1990-02-30' }, TODAY)).toBe('Enter your birth date.');
    expect(profileInputError({ ...VALID, birthDate: '2026-10-27' }, TODAY)).toBe('Birth date cannot be in the future.');
  });

  it.each([0, -1, 2.5, NaN, 1001])('rejects a protein target of %p', (proteinG) => {
    const input = { ...VALID, targets: { ...DEFAULT_TARGETS, proteinG } };
    expect(profileInputError(input, TODAY)).toBe('Protein must be a whole number from 1 to 1000.');
  });
});
