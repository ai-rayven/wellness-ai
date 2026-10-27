// reportIssue through the emulators, called with the Firebase client SDK like the app does.
// No GitHub token is set in the emulator, so it answers with a fake issue.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, signOut } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

import type { Issue } from './github';

let app: FirebaseApp;

beforeAll(() => {
  app = initializeApp({ projectId: 'demo-sano', apiKey: 'demo-key' });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(getFunctions(app), '127.0.0.1', 5001);
});

beforeEach(async () => {
  await signInAnonymously(getAuth(app));
});

afterAll(async () => {
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
