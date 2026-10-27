// checkInvite through the Auth and Functions emulators, with a Google sign-in like the app does.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

import { INVITED_EMAIL, invite, signInWithGoogle } from './testing';

const PROJECT_ID = 'demo-sano';

let app: FirebaseApp;
let env: RulesTestEnvironment;

beforeAll(async () => {
  app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key' });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  env = await initializeTestEnvironment({ projectId: PROJECT_ID });
});

beforeEach(async () => {
  await env.clearFirestore();
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
});

afterAll(async () => {
  await env.cleanup();
  await deleteApp(app);
});

describe('checkInvite', () => {
  it('creates the account of an invited email', async () => {
    await invite(env, [INVITED_EMAIL]);
    await signInWithGoogle(app, INVITED_EMAIL);
    expect(getAuth(app).currentUser?.email).toBe(INVITED_EMAIL);
  });

  it('rejects an email that is not invited', async () => {
    await invite(env, [INVITED_EMAIL]);
    await expect(signInWithGoogle(app, 'eve@example.com')).rejects.toThrow('This account is not invited.');
  });

  it('rejects everyone when there is no invite list', async () => {
    await expect(signInWithGoogle(app, INVITED_EMAIL)).rejects.toThrow('This account is not invited.');
  });
});
