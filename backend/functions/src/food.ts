// The Food that searchFoods returns. The frontend has the same type in src/lib/types.ts.

export interface Nutrients {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Food {
  /** `${metadata.source}_${metadata.lookupId}` */
  id: string;
  name: string;
  brand: string;
  nutrientsPer100g: Nutrients;
  metadata: { source: string; lookupId: string };
}

export function foodId(source: string, lookupId: string): string {
  return `${source}_${lookupId}`;
}
