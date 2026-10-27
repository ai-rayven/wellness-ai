import { FirebaseError } from 'firebase/app';
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
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    // The checkInvite function rejected a new account. The SDK reports that as internal-error,
    // with the server status in the message.
    if (e instanceof FirebaseError && e.code === 'auth/internal-error' && e.message.includes('PERMISSION_DENIED')) {
      throw new Error('This account is not invited. Ask the owner of Sano to add your email.');
    }
    throw e;
  }
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
