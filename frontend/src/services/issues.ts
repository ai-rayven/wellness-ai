// Issue reports: the reportIssue Cloud Function creates them in the app's GitHub repo.
import { httpsCallable } from 'firebase/functions';

import { functions } from '@/lib/firebase';

export interface IssueInput {
  title: string;
  description: string;
}

export interface Issue {
  number: number;
}

const callReportIssue = httpsCallable<IssueInput, Issue>(functions, 'reportIssue');

export async function reportIssue(input: IssueInput): Promise<Issue> {
  const title = input.title.trim();
  if (!title) throw new RangeError('title must not be empty');

  return (await callReportIssue({ title, description: input.description.trim() })).data;
}
