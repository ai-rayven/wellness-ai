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
