import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/https';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

import { EdamamError, searchEdamam } from './edamam';
import type { Food } from './food';
import { GitHubError, createGitHubIssue, type Issue, type IssueInput } from './github';
import { searchMockFoods } from './mockFoods';

initializeApp();

const EDAMAM_APP_ID = defineSecret('EDAMAM_APP_ID');
const EDAMAM_APP_KEY = defineSecret('EDAMAM_APP_KEY');
const GITHUB_ISSUES_TOKEN = defineSecret('GITHUB_ISSUES_TOKEN');

const MAX_QUERY_LENGTH = 100;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

const inEmulator = () => process.env.FUNCTIONS_EMULATOR === 'true';

/** Searches foods by name and saves new ones to `foods/{id}`. Only for signed-in users. */
export const searchFoods = onCall({ secrets: [EDAMAM_APP_ID, EDAMAM_APP_KEY] }, async (request): Promise<Food[]> => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to search foods.');
  const query = (request.data as { query?: unknown } | null)?.query;
  if (typeof query !== 'string' || !query.trim()) throw new HttpsError('invalid-argument', 'query must be a non-empty string.');
  if (query.length > MAX_QUERY_LENGTH) throw new HttpsError('invalid-argument', `query must be at most ${MAX_QUERY_LENGTH} characters.`);

  const foods = await search(query.trim());
  await saveNewFoods(foods);
  return foods;
});

async function search(query: string): Promise<Food[]> {
  const credentials = { appId: EDAMAM_APP_ID.value(), appKey: EDAMAM_APP_KEY.value() };
  const useMock = inEmulator() && !(credentials.appId && credentials.appKey);
  if (useMock) return searchMockFoods(query);

  try {
    return await searchEdamam(query, credentials);
  } catch (error) {
    if (!(error instanceof EdamamError)) throw error;
    // Not `message`: the logger writes its own text to that field.
    logger.error('Edamam search failed', { query, reason: error.message });
    throw new HttpsError('unavailable', 'Food search is unavailable. Try again later.');
  }
}

/** Creates `foods/{id}` for foods not stored yet. Existing documents are left unchanged. */
async function saveNewFoods(foods: Food[]): Promise<void> {
  if (foods.length === 0) return;

  const db = getFirestore();
  const refs = foods.map((food) => db.collection('foods').doc(food.id));
  const snapshots = await db.getAll(...refs);
  const batch = db.batch();
  snapshots.forEach((snapshot, i) => {
    if (snapshot.exists) return;
    const { name, brand, nutrientsPer100g, metadata } = foods[i];
    batch.set(snapshot.ref, { name, brand, nutrientsPer100g, metadata, createdAt: FieldValue.serverTimestamp() });
  });
  await batch.commit();
}

/** Creates a GitHub issue in the Sano repo from the Profile tab. Only for signed-in users. */
export const reportIssue = onCall({ secrets: [GITHUB_ISSUES_TOKEN] }, async (request): Promise<Issue> => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to report an issue.');
  const data = request.data as { title?: unknown; description?: unknown } | null;
  const { title, description } = data ?? {};
  if (typeof title !== 'string' || !title.trim()) throw new HttpsError('invalid-argument', 'title must be a non-empty string.');
  if (title.length > MAX_TITLE_LENGTH) throw new HttpsError('invalid-argument', `title must be at most ${MAX_TITLE_LENGTH} characters.`);
  if (typeof description !== 'string') throw new HttpsError('invalid-argument', 'description must be a string.');
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new HttpsError('invalid-argument', `description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`);
  }

  return createIssue({ title, description });
});

async function createIssue(input: IssueInput): Promise<Issue> {
  const token = GITHUB_ISSUES_TOKEN.value();
  // Without a token, the emulator answers with a fake issue and creates nothing.
  if (inEmulator() && !token) return { number: 1 };

  try {
    return await createGitHubIssue(input, token);
  } catch (error) {
    if (!(error instanceof GitHubError)) throw error;
    logger.error('GitHub issue creation failed', { title: input.title, reason: error.message });
    throw new HttpsError('unavailable', 'Could not create the issue. Try again later.');
  }
}
