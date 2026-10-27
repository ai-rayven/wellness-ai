// users/{uid}: the profile document. Conversion to and from Firestore stays in this file.
import { doc, onSnapshot, serverTimestamp, setDoc, type DocumentSnapshot, type Unsubscribe } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { profileInputError, type ProfileInput } from '@/lib/profile';
import type { IsoDate, User } from '@/lib/types';

import type { Account } from './auth';

const userRef = (uid: string) => doc(db, 'users', uid);

/** Calls `onChange` with the profile, or null until setup has created it. */
export function watchProfile(
  uid: string,
  onChange: (user: User | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!uid) throw new RangeError('uid must not be empty');

  return onSnapshot(userRef(uid), (snapshot) => onChange(toUser(snapshot)), onError);
}

/** Creates the profile at the end of setup. */
export async function createProfile(account: Account, input: ProfileInput, today: IsoDate): Promise<void> {
  if (!account.uid) throw new RangeError('account.uid must not be empty');
  const error = profileInputError(input, today);
  if (error) throw new RangeError(error);

  await setDoc(userRef(account.uid), {
    displayName: account.displayName,
    email: account.email,
    sex: input.sex,
    birthDate: input.birthDate,
    targets: input.targets,
    createdAt: serverTimestamp(),
  });
}

function toUser(snapshot: DocumentSnapshot): User | null {
  const data = snapshot.data();
  if (!data) return null;
  return {
    id: snapshot.id,
    displayName: data.displayName,
    email: data.email,
    sex: data.sex,
    birthDate: data.birthDate,
    targets: data.targets,
  };
}
