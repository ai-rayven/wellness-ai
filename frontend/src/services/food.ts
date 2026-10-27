// Foods: search through the searchFoods Cloud Function, and the shared foods/{id} documents.
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions } from '@/lib/firebase';
import type { Food } from '@/lib/types';

const callSearchFoods = httpsCallable<{ query: string }, Food[]>(functions, 'searchFoods');

export async function searchFoods(query: string): Promise<Food[]> {
  const trimmed = query.trim();
  if (!trimmed) throw new RangeError('query must not be empty');

  return (await callSearchFoods({ query: trimmed })).data;
}

/** The food, or null when no foods/{id} document exists. */
export async function getFood(id: string): Promise<Food | null> {
  if (!id) throw new RangeError('id must not be empty');

  const snapshot = await getDoc(doc(db, 'foods', id));
  const data = snapshot.data();
  if (!data) return null;
  return {
    id: snapshot.id,
    name: data.name,
    brand: data.brand,
    nutrientsPer100g: data.nutrientsPer100g,
    metadata: data.metadata,
  };
}
