// Firestore Security Rules against the emulator: the access table in docs/mvp.md.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterAll, beforeAll, beforeEach, describe, it } from '@jest/globals';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-sano',
    firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8') },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'foods/edamam_food_banana'), { name: 'Banana' });
    await setDoc(doc(db, 'users/alice'), { displayName: 'Alice' });
    await setDoc(doc(db, 'users/alice/logEntries/e1'), { grams: 100 });
    await setDoc(doc(db, 'users/alice/weights/2026-10-26'), { weightLb: 180 });
  });
});

afterAll(async () => {
  await env.cleanup();
});

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const guest = () => env.unauthenticatedContext().firestore();

const OWNED = ['users/alice', 'users/alice/logEntries/e1', 'users/alice/weights/2026-10-26'];

describe('foods', () => {
  it('can be read by any signed-in user', async () => {
    await assertSucceeds(getDoc(doc(bob(), 'foods/edamam_food_banana')));
  });

  it('cannot be read when signed out', async () => {
    await assertFails(getDoc(doc(guest(), 'foods/edamam_food_banana')));
  });

  it('cannot be written by users', async () => {
    await assertFails(setDoc(doc(alice(), 'foods/edamam_new'), { name: 'Fake' }));
    await assertFails(setDoc(doc(alice(), 'foods/edamam_food_banana'), { name: 'Changed' }));
    await assertFails(deleteDoc(doc(alice(), 'foods/edamam_food_banana')));
  });
});

describe.each(OWNED)('%s', (path) => {
  it('can be read, written and deleted by its owner', async () => {
    await assertSucceeds(getDoc(doc(alice(), path)));
    await assertSucceeds(setDoc(doc(alice(), path), { updated: true }));
    await assertSucceeds(deleteDoc(doc(alice(), path)));
  });

  it('cannot be read or written by another user', async () => {
    await assertFails(getDoc(doc(bob(), path)));
    await assertFails(setDoc(doc(bob(), path), { updated: true }));
    await assertFails(deleteDoc(doc(bob(), path)));
  });

  it('cannot be read or written when signed out', async () => {
    await assertFails(getDoc(doc(guest(), path)));
    await assertFails(setDoc(doc(guest(), path), { updated: true }));
  });
});

describe('other paths', () => {
  it('are denied, also below the own user', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice/other/x'), { a: 1 }));
    await assertFails(setDoc(doc(alice(), 'other/x'), { a: 1 }));
  });

  it('include the invite list, which only the functions read', async () => {
    await assertFails(getDoc(doc(alice(), 'config/access')));
    await assertFails(setDoc(doc(alice(), 'config/access'), { emails: ['alice@example.com'] }));
  });
});
