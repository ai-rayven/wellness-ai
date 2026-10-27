// users/{uid}/weights/{date}: one weight per day. Conversion to and from Firestore stays in this file.
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { isIsoDate } from '@/lib/dates';
import { db } from '@/lib/firebase';
import type { IsoDate, WeightEntry } from '@/lib/types';
import { MAX_WEIGHT_LB, MIN_WEIGHT_LB } from '@/lib/weight';

const weights = (uid: string) => collection(db, 'users', uid, 'weights');

function assertDate(date: IsoDate, name: string): void {
  if (!isIsoDate(date)) throw new RangeError(`${name} must be YYYY-MM-DD, got "${date}"`);
}

/** Logs the weight for `date`, and replaces the one already logged for that day. */
export async function setWeight(uid: string, entry: WeightEntry, today: IsoDate): Promise<void> {
  if (!uid) throw new RangeError('uid must not be empty');
  assertDate(entry.date, 'date');
  if (entry.date > today) throw new RangeError('cannot log weight for a future day');
  if (!(entry.weightLb >= MIN_WEIGHT_LB && entry.weightLb <= MAX_WEIGHT_LB)) {
    throw new RangeError(`weightLb must be from ${MIN_WEIGHT_LB} to ${MAX_WEIGHT_LB}`);
  }

  await setDoc(doc(weights(uid), entry.date), { weightLb: entry.weightLb, createdAt: serverTimestamp() });
}

export async function removeWeight(uid: string, date: IsoDate): Promise<void> {
  if (!uid) throw new RangeError('uid must not be empty');
  assertDate(date, 'date');

  await deleteDoc(doc(weights(uid), date));
}

/** Calls `onChange` with the entries from `from` to `to` (both included), oldest first. */
export function watchWeights(
  uid: string,
  from: IsoDate,
  to: IsoDate,
  onChange: (entries: WeightEntry[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!uid) throw new RangeError('uid must not be empty');
  assertDate(from, 'from');
  assertDate(to, 'to');
  if (from > to) throw new RangeError('from is after to');

  // The document id is the date, so one range on the id needs no index.
  const range = query(weights(uid), where(documentId(), '>=', from), where(documentId(), '<=', to), orderBy(documentId()));
  return onSnapshot(
    range,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ date: d.id, weightLb: d.get('weightLb') }))),
    onError,
  );
}

/** Calls `onChange` with the latest `count` entries, oldest first. */
export function watchLatestWeights(
  uid: string,
  count: number,
  onChange: (entries: WeightEntry[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!uid) throw new RangeError('uid must not be empty');
  if (!Number.isInteger(count) || count <= 0) throw new RangeError('count must be a positive whole number');

  const latest = query(weights(uid), orderBy(documentId(), 'desc'), limit(count));
  return onSnapshot(
    latest,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ date: d.id, weightLb: d.get('weightLb') })).reverse()),
    onError,
  );
}
