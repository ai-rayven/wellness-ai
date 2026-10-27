// Issue reports: the reportIssue Cloud Function creates them in the app's GitHub repo.
// Screenshots go to Cloud Storage first, at issues/{uid}/{uuid}.jpg (see backend/storage.rules).
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes } from 'firebase/storage';

import { functions, storage } from '@/lib/firebase';

/** The same limit as the reportIssue function. */
export const MAX_SCREENSHOTS = 3;

// Phone screenshots are about 1170 px wide PNGs of 1-5 MB. This width keeps them readable at a few hundred KB.
const SCREENSHOT_WIDTH = 1080;
const JPEG_QUALITY = 0.8;

export interface IssueInput {
  title: string;
  description: string;
  /** Image files the user picked, for example phone screenshots. */
  screenshots: Blob[];
}

export interface Issue {
  number: number;
}

interface ReportIssueRequest {
  title: string;
  description: string;
  screenshots: string[];
}

const callReportIssue = httpsCallable<ReportIssueRequest, Issue>(functions, 'reportIssue');

export async function reportIssue(uid: string, input: IssueInput): Promise<Issue> {
  if (!uid) throw new RangeError('uid must not be empty');
  const title = input.title.trim();
  if (!title) throw new RangeError('title must not be empty');
  if (input.screenshots.length > MAX_SCREENSHOTS) throw new RangeError(`at most ${MAX_SCREENSHOTS} screenshots`);

  const screenshots = await Promise.all(input.screenshots.map((image) => uploadScreenshot(uid, image)));
  return (await callReportIssue({ title, description: input.description.trim(), screenshots })).data;
}

/** Uploads the image as a smaller JPEG and returns its Storage path. */
async function uploadScreenshot(uid: string, image: Blob): Promise<string> {
  const path = `issues/${uid}/${crypto.randomUUID()}.jpg`;
  await uploadBytes(ref(storage, path), await toJpeg(image), { contentType: 'image/jpeg' });
  return path;
}

/** Web only: the browser decodes and encodes the image. The iOS and Android apps will need their own. */
async function toJpeg(image: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(image);
  const scale = Math.min(1, SCREENSHOT_WIDTH / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not read the image.'))), 'image/jpeg', JPEG_QUALITY);
  });
}
