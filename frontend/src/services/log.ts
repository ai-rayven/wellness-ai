// users/{uid}/logEntries: the food log. Conversion to and from Firestore stays in this file.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import { isIsoDate } from '@/lib/dates';
import { db } from '@/lib/firebase';
import { isMealType } from '@/lib/meals';
import { nutrientsForGrams } from '@/lib/nutrients';
import type { Food, FoodSnapshot, IsoDate, LogEntry, MealType } from '@/lib/types';

/** How many latest entries are scanned for recent foods. */
const RECENT_SCAN = 50;

const entries = (uid: string) => collection(db, 'users', uid, 'logEntries');

/** A food from the user's latest entries, as it was logged. */
export interface RecentFood {
  foodId: string;
  food: FoodSnapshot;
}

export interface EntryInput {
  meal: MealType;
  grams: number;
}

function assertUid(uid: string): void {
  if (!uid) throw new RangeError('uid must not be empty');
}

function assertEntryInput({ meal, grams }: EntryInput): void {
  if (!isMealType(meal)) throw new RangeError(`meal is invalid: "${meal}"`);
  if (!Number.isFinite(grams) || grams <= 0) throw new RangeError('grams must be a positive number');
}

/** Logs `grams` of `food` to `date`, with a snapshot of the food. Returns the entry id. */
export async function addEntry(uid: string, food: Food, input: EntryInput, date: IsoDate, today: IsoDate): Promise<string> {
  assertUid(uid);
  assertEntryInput(input);
  if (!isIsoDate(date)) throw new RangeError(`date must be YYYY-MM-DD, got "${date}"`);
  if (date > today) throw new RangeError('cannot log to a future day');

  const snapshot: FoodSnapshot = { name: food.name, brand: food.brand, nutrientsPer100g: food.nutrientsPer100g };
  const ref = await addDoc(entries(uid), {
    date,
    meal: input.meal,
    foodId: food.id,
    food: snapshot,
    grams: input.grams,
    nutrients: nutrientsForGrams(snapshot.nutrientsPer100g, input.grams),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Changes meal and grams. Nutrients are calculated again from the entry's own food snapshot. */
export async function updateEntry(uid: string, entry: LogEntry, input: EntryInput): Promise<void> {
  assertUid(uid);
  assertEntryInput(input);

  await updateDoc(doc(entries(uid), entry.id), {
    meal: input.meal,
    grams: input.grams,
    nutrients: nutrientsForGrams(entry.food.nutrientsPer100g, input.grams),
  });
}

export async function removeEntry(uid: string, id: string): Promise<void> {
  assertUid(uid);
  if (!id) throw new RangeError('id must not be empty');

  await deleteDoc(doc(entries(uid), id));
}

export async function getEntry(uid: string, id: string): Promise<LogEntry | null> {
  assertUid(uid);
  if (!id) throw new RangeError('id must not be empty');

  return toEntry(await getDoc(doc(entries(uid), id)));
}

/** Calls `onChange` with the day's entries in the order they were logged. */
export function watchDay(
  uid: string,
  date: IsoDate,
  onChange: (entries: LogEntry[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  assertUid(uid);
  if (!isIsoDate(date)) throw new RangeError(`date must be YYYY-MM-DD, got "${date}"`);

  // One equality filter only, so no composite index: sort by createdAt here.
  return onSnapshot(
    query(entries(uid), where('date', '==', date)),
    (snapshot) => {
      const docs = [...snapshot.docs].sort((a, b) => createdAtMillis(a) - createdAtMillis(b));
      onChange(docs.map(toEntry).filter((e): e is LogEntry => e !== null));
    },
    onError,
  );
}

/** Distinct foods from the latest entries, newest first. */
export async function recentFoods(uid: string, count: number): Promise<RecentFood[]> {
  assertUid(uid);
  if (!Number.isInteger(count) || count <= 0) throw new RangeError('count must be a positive whole number');

  const snapshot = await getDocs(query(entries(uid), orderBy('createdAt', 'desc'), limit(RECENT_SCAN)));
  const recent = new Map<string, RecentFood>();
  for (const entry of snapshot.docs.map(toEntry)) {
    if (!entry || recent.has(entry.foodId)) continue;
    recent.set(entry.foodId, { foodId: entry.foodId, food: entry.food });
    if (recent.size === count) break;
  }
  return [...recent.values()];
}

/** A pending local write has no server createdAt yet: it sorts last, as the newest. */
function createdAtMillis(snapshot: DocumentSnapshot): number {
  return snapshot.get('createdAt')?.toMillis() ?? Number.MAX_SAFE_INTEGER;
}

function toEntry(snapshot: DocumentSnapshot): LogEntry | null {
  const data = snapshot.data();
  if (!data) return null;
  return {
    id: snapshot.id,
    date: data.date,
    meal: data.meal,
    foodId: data.foodId,
    food: data.food,
    grams: data.grams,
    nutrients: data.nutrients,
  };
}
