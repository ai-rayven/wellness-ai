import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Unsubscribe,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

/** The signed-in account, as Firebase Auth knows it. */
export interface Account {
  uid: string;
  displayName: string;
  email: string;
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAccountChanged(callback: (account: Account | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, (user) => {
    if (!user) return callback(null);
    callback({ uid: user.uid, displayName: user.displayName ?? '', email: user.email ?? '' });
  });
}
