// App entities from docs/mvp.md. Firestore-only fields (createdAt) are added and removed in src/services.

/** Local calendar day, `YYYY-MM-DD`. */
export type IsoDate = string;

export type Sex = 'male' | 'female';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Nutrients {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  sex: Sex;
  birthDate: IsoDate;
  targets: Nutrients;
}

export interface FoodMetadata {
  source: string;
  lookupId: string;
}

export interface Food {
  /** `${metadata.source}_${metadata.lookupId}` */
  id: string;
  name: string;
  brand: string;
  nutrientsPer100g: Nutrients;
  metadata: FoodMetadata;
}

/** The food as it was when logged, so later changes to `foods/{id}` never alter past entries. */
export type FoodSnapshot = Pick<Food, 'name' | 'brand' | 'nutrientsPer100g'>;

export interface LogEntry {
  id: string;
  date: IsoDate;
  meal: MealType;
  foodId: string;
  food: FoodSnapshot;
  grams: number;
  nutrients: Nutrients;
}

export interface WeightEntry {
  date: IsoDate;
  weightLb: number;
}

export interface DailySummary {
  date: IsoDate;
  entries: LogEntry[];
  totals: Nutrients;
}
