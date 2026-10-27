// Cloud Storage Security Rules against the emulator: the access table in docs/mvp.md.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterAll, beforeAll, describe, it } from '@jest/globals';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

const FILE = '0b4c5e2a-7f1d-4c3b-9a8e-2d6f1b0c9e7a.jpg';
const JPEG = { contentType: 'image/jpeg' };

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-sano',
    storage: { rules: readFileSync(resolve(__dirname, '../../storage.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

const alice = () => env.authenticatedContext('alice').storage();
const upload = (storage: ReturnType<typeof alice>, path: string, bytes: Uint8Array, metadata = JPEG) =>
  uploadBytes(ref(storage, path), bytes, metadata);

describe('issue screenshots', () => {
  it('a user uploads a JPEG screenshot to their folder', async () => {
    await assertSucceeds(upload(alice(), `issues/alice/${FILE}`, new Uint8Array(10)));
  });

  it('a user cannot upload to the folder of another user, or when signed out', async () => {
    await assertFails(upload(alice(), `issues/bob/${FILE}`, new Uint8Array(10)));
    await assertFails(upload(env.unauthenticatedContext().storage(), `issues/alice/${FILE}`, new Uint8Array(10)));
  });

  it('rejects other file names, other types and files of 2 MB or more', async () => {
    await assertFails(upload(alice(), 'issues/alice/photo.jpg', new Uint8Array(10)));
    await assertFails(upload(alice(), `issues/alice/${FILE}`, new Uint8Array(10), { contentType: 'image/png' }));
    await assertFails(upload(alice(), `issues/alice/${FILE}`, new Uint8Array(2 * 1024 * 1024)));
  });

  it('nobody reads a screenshot through the rules', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), `issues/alice/${FILE}`), new Uint8Array(10), JPEG);
    });
    await assertFails(getBytes(ref(alice(), `issues/alice/${FILE}`)));
  });

  it('a screenshot cannot be replaced', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), `issues/alice/${FILE}`), new Uint8Array(10), JPEG);
    });
    await assertFails(upload(alice(), `issues/alice/${FILE}`, new Uint8Array(10)));
  });
});
