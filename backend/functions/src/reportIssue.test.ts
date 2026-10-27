// reportIssue through the emulators, called with the Firebase client SDK like the app does.
// No GitHub token is set in the emulator, so it answers with a fake issue.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signOut } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

import type { Issue } from './github';
import { INVITED_EMAIL, invite, signInWithGoogle } from './testing';

let app: FirebaseApp;
let env: RulesTestEnvironment;

beforeAll(async () => {
  app = initializeApp({ projectId: 'demo-sano', apiKey: 'demo-key' });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(getFunctions(app), '127.0.0.1', 5001);
  env = await initializeTestEnvironment({ projectId: 'demo-sano' });
});

beforeEach(async () => {
  await invite(env, [INVITED_EMAIL]);
  await signInWithGoogle(app, INVITED_EMAIL);
});

afterAll(async () => {
  await env.cleanup();
  await deleteApp(app);
});

const reportIssue = (data: unknown) => httpsCallable<unknown, Issue>(getFunctions(app), 'reportIssue')(data);

describe('reportIssue', () => {
  it('returns the created issue', async () => {
    const { data } = await reportIssue({ title: 'Chart is empty', description: '' });
    expect(data).toEqual({ number: 1 });
  });

  it('rejects signed-out callers', async () => {
    await signOut(getAuth(app));
    await expect(reportIssue({ title: 'Chart is empty', description: '' })).rejects.toMatchObject({
      code: 'functions/unauthenticated',
    });
  });

  it.each([
    {},
    null,
    { title: ' ', description: '' },
    { title: 42, description: '' },
    { title: 'x'.repeat(201), description: '' },
    { title: 'Chart is empty' },
    { title: 'Chart is empty', description: 'x'.repeat(5001) },
  ])('rejects the input %p', async (input) => {
    await expect(reportIssue(input)).rejects.toMatchObject({ code: 'functions/invalid-argument' });
  });
});
