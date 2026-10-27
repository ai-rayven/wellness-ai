// searchFoods through the emulators, called with the Firebase client SDK like the app does.
// No Edamam keys are set in the emulator, so it answers with the mock foods.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

import type { Food } from './food';
import { INVITED_EMAIL, invite, signInWithGoogle } from './testing';

const PROJECT_ID = 'demo-sano';

let app: FirebaseApp;
let env: RulesTestEnvironment;

beforeAll(async () => {
  app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key' });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(getFunctions(app), '127.0.0.1', 5001);
  env = await initializeTestEnvironment({ projectId: PROJECT_ID });
});

beforeEach(async () => {
  await env.clearFirestore();
  await invite(env, [INVITED_EMAIL]);
  await signInWithGoogle(app, INVITED_EMAIL);
});

afterAll(async () => {
  await env.cleanup();
  await deleteApp(app);
});

const searchFoods = (data: unknown) => httpsCallable<unknown, Food[]>(getFunctions(app), 'searchFoods')(data);

async function storedFood(id: string) {
  let data: Record<string, unknown> | undefined;
  await env.withSecurityRulesDisabled(async (ctx) => {
    data = (await getDoc(doc(ctx.firestore(), 'foods', id))).data();
  });
  return data;
}

describe('searchFoods', () => {
  it('returns matching foods', async () => {
    const { data } = await searchFoods({ query: ' Greek  yogurt ' });
    expect(data.map((f) => f.name)).toEqual(['Greek yogurt, plain, nonfat', 'Greek yogurt, plain']);
    expect(data[1]).toEqual({
      id: 'mock_greek-yogurt-plain-fage-total-0',
      name: 'Greek yogurt, plain',
      brand: 'Fage Total 0%',
      nutrientsPer100g: { kcal: 54, proteinG: 10.3, carbsG: 3.8, fatG: 0 },
      metadata: { source: 'mock', lookupId: 'greek-yogurt-plain-fage-total-0' },
    });
  });

  it('saves the returned foods once, with createdAt', async () => {
    const { data } = await searchFoods({ query: 'banana' });
    const first = await storedFood(data[0].id);
    expect(first).toMatchObject({ name: 'Banana', metadata: { source: 'mock', lookupId: 'banana' } });
    expect(first?.createdAt).toBeDefined();
    expect(first?.id).toBeUndefined();

    await searchFoods({ query: 'banana' });
    expect((await storedFood(data[0].id))?.createdAt).toEqual(first?.createdAt);
  });

  it('returns an empty list when nothing matches', async () => {
    expect((await searchFoods({ query: 'zzz' })).data).toEqual([]);
  });

  it('rejects signed-out callers', async () => {
    await signOut(getAuth(app));
    await expect(searchFoods({ query: 'banana' })).rejects.toMatchObject({ code: 'functions/unauthenticated' });
  });

  it.each([{}, { query: '' }, { query: '  ' }, { query: 42 }, { query: 'x'.repeat(101) }, null])(
    'rejects the input %p',
    async (input) => {
      await expect(searchFoods(input)).rejects.toMatchObject({ code: 'functions/invalid-argument' });
    },
  );
});
