// reportIssue through the emulators, called with the Firebase client SDK like the app does.
// No GitHub token is set in the emulator, so it answers with a fake issue.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signOut } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { connectStorageEmulator, getStorage, ref, uploadBytes } from 'firebase/storage';

import type { Issue } from './github';
import { INVITED_EMAIL, invite, signInWithGoogle } from './testing';

let app: FirebaseApp;
let env: RulesTestEnvironment;

beforeAll(async () => {
  app = initializeApp({ projectId: 'demo-sano', apiKey: 'demo-key', storageBucket: 'demo-sano.appspot.com' });
  connectAuthEmulator(getAuth(app), 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFunctionsEmulator(getFunctions(app), '127.0.0.1', 5001);
  connectStorageEmulator(getStorage(app), '127.0.0.1', 9199);
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

/** Uploads a screenshot as the signed-in user, like the app does, and returns its path. */
async function uploadScreenshot(): Promise<string> {
  const path = `issues/${getAuth(app).currentUser!.uid}/${crypto.randomUUID()}.jpg`;
  await uploadBytes(ref(getStorage(app), path), new Uint8Array([0xff, 0xd8, 0xff]), { contentType: 'image/jpeg' });
  return path;
}

describe('reportIssue', () => {
  it('returns the created issue', async () => {
    const { data } = await reportIssue({ title: 'Chart is empty', description: '' });
    expect(data).toEqual({ number: 1 });
  });

  it('returns the created issue with uploaded screenshots', async () => {
    const screenshots = [await uploadScreenshot(), await uploadScreenshot()];
    const { data } = await reportIssue({ title: 'Chart is empty', description: '', screenshots });
    expect(data).toEqual({ number: 1 });
  });

  it('rejects a screenshot that was not uploaded', async () => {
    const path = `issues/${getAuth(app).currentUser!.uid}/${crypto.randomUUID()}.jpg`;
    await expect(reportIssue({ title: 'Chart is empty', description: '', screenshots: [path] })).rejects.toMatchObject({
      code: 'functions/invalid-argument',
    });
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
    { title: 'Chart is empty', description: '', screenshots: 'issues/a/b.jpg' },
    { title: 'Chart is empty', description: '', screenshots: ['users/someone/x.jpg'] },
    { title: 'Chart is empty', description: '', screenshots: Array(4).fill('x') },
  ])('rejects the input %p', async (input) => {
    await expect(reportIssue(input)).rejects.toMatchObject({ code: 'functions/invalid-argument' });
  });
});
