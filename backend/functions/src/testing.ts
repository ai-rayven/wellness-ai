// Test helpers for the emulators. Not part of the deployed functions (see tsconfig.json).
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import type { FirebaseApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { ACCESS_DOC } from './access';

export const INVITED_EMAIL = 'ana@example.com';

/** Writes the invite list. */
export async function invite(env: RulesTestEnvironment, emails: string[]): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), ACCESS_DOC), { emails });
  });
}

/** Signs in to the Auth emulator with a Google account. The emulator accepts an unsigned JSON id token. */
export async function signInWithGoogle(app: FirebaseApp, email: string): Promise<void> {
  const idToken = JSON.stringify({ sub: email, email, email_verified: true });
  await signInWithCredential(getAuth(app), GoogleAuthProvider.credential(idToken));
}
