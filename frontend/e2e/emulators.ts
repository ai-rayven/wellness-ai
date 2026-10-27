// Direct access to the emulators for test setup and checks.
const PROJECT = 'demo-sano';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const OWNER = { Authorization: 'Bearer owner' };

/** The email that `resetEmulators` invites. */
export const INVITED_EMAIL = 'ana@example.com';

/** Deletes all data and accounts, then invites INVITED_EMAIL. */
export async function resetEmulators(): Promise<void> {
  await Promise.all([
    fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' }),
    fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' }),
  ]).then((responses) => responses.forEach((r) => {
    if (!r.ok) throw new Error(`Emulator reset failed: ${r.status} ${r.url}`);
  }));

  const invite = { fields: { emails: { arrayValue: { values: [{ stringValue: INVITED_EMAIL }] } } } };
  const response = await fetch(`${FIRESTORE}/config/access`, { method: 'PATCH', headers: OWNER, body: JSON.stringify(invite) });
  if (!response.ok) throw new Error(`Invite failed: ${response.status}`);
}

/** The documents of a collection as Firestore REST JSON, read past the Security Rules. */
export async function listDocuments(path: string): Promise<{ name: string; fields: Record<string, unknown> }[]> {
  const response = await fetch(`${FIRESTORE}/${path}`, { headers: OWNER });
  if (!response.ok) throw new Error(`Firestore list failed: ${response.status}`);
  return ((await response.json()) as { documents?: [] }).documents ?? [];
}

const STORAGE = `http://127.0.0.1:9199/v0/b/${PROJECT}.appspot.com/o`;

/** A file in the Storage emulator. */
export interface StoredFile {
  name: string;
  contentType: string;
  size: number;
}

/** The files under `prefix` in the Storage emulator, read past the Security Rules. */
export async function listFiles(prefix: string): Promise<StoredFile[]> {
  const response = await fetch(`${STORAGE}?prefix=${encodeURIComponent(prefix)}`, { headers: OWNER });
  if (!response.ok) throw new Error(`Storage list failed: ${response.status}`);
  const { items = [] } = (await response.json()) as { items?: { name: string }[] };

  return Promise.all(
    items.map(async ({ name }) => {
      const file = await fetch(`${STORAGE}/${encodeURIComponent(name)}`, { headers: OWNER });
      if (!file.ok) throw new Error(`Storage metadata failed: ${file.status}`);
      const { contentType, size } = (await file.json()) as { contentType: string; size: string };
      return { name, contentType, size: Number(size) };
    }),
  );
}
