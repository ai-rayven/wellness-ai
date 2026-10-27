import type { MealType } from './types';

export const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export function isMealType(value: unknown): value is MealType {
  return MEALS.some((meal) => meal.value === value);
}

/** The meal that fits the local time of `date`, as in the mockup. */
export function mealAt(date: Date): MealType {
  if (Number.isNaN(date.getTime())) throw new RangeError('date is invalid');

  const hour = date.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}
