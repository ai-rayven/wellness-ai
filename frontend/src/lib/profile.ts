import { isIsoDate } from './dates';
import { NUTRIENTS } from './nutrients';
import type { IsoDate, Nutrients, Sex } from './types';

export const DEFAULT_TARGETS: Nutrients = { kcal: 2200, proteinG: 150, carbsG: 220, fatG: 70 };

/** What the user enters on the setup and profile screens. */
export interface ProfileInput {
  sex: Sex;
  birthDate: IsoDate;
  targets: Nutrients;
}

const MAX_TARGET: Nutrients = { kcal: 10000, proteinG: 1000, carbsG: 2000, fatG: 1000 };

/** The first problem with `input`, or null when it is valid. `today` is the local day. */
export function profileInputError(input: Partial<ProfileInput>, today: IsoDate): string | null {
  if (input.sex !== 'male' && input.sex !== 'female') return 'Choose your sex.';
  if (!input.birthDate || !isIsoDate(input.birthDate)) return 'Enter your birth date.';
  if (input.birthDate > today) return 'Birth date cannot be in the future.';
  if (!input.targets) return 'Enter your daily targets.';

  for (const { key, label } of NUTRIENTS) {
    const value = input.targets[key];
    if (!Number.isInteger(value) || value <= 0 || value > MAX_TARGET[key]) {
      return `${label} must be a whole number from 1 to ${MAX_TARGET[key]}.`;
    }
  }
  return null;
}
