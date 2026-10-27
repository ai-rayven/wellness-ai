import { View } from 'react-native';

import type { Nutrients } from '@/lib/types';

import colors from '../../colors';

const COLORS: Record<keyof Nutrients, string | null> = {
  kcal: null,
  proteinG: colors.protein,
  carbsG: colors.carbs,
  fatG: colors.fat,
};

export const nutrientColor = (key: keyof Nutrients): string => COLORS[key] ?? colors.sun;

/** The colored dot before a macro's name. Calories have none. */
export function NutrientDot({ nutrient }: { nutrient: keyof Nutrients }) {
  const color = COLORS[nutrient];
  if (!color) return null;
  return <View className="size-2 rounded-full" style={{ backgroundColor: color }} />;
}
