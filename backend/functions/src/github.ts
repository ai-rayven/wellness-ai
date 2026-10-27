// GitHub REST API: https://docs.github.com/en/rest/issues/issues#create-an-issue
// The only place that knows GitHub's request and response shapes.

const REPO = 'ai-rayven/wellness-ai';
const ISSUES_URL = `https://api.github.com/repos/${REPO}/issues`;
const FOOTER = '\n\n---\nReported from the Sano app.';

export interface IssueInput {
  title: string;
  description: string;
}

export interface Issue {
  number: number;
}

export class GitHubError extends Error {}

/** Creates an issue in the Sano repo with a fine-grained token that has Issues: write. */
export async function createGitHubIssue(input: IssueInput, token: string): Promise<Issue> {
  if (!input.title.trim()) throw new RangeError('title must not be empty');
  if (!token) throw new RangeError('GitHub token is missing');

  const response = await fetch(ISSUES_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title: input.title.trim(), body: input.description.trim() + FOOTER }),
  });
  if (!response.ok) throw new GitHubError(`GitHub answered ${response.status}`);

  const data = (await response.json()) as { number?: unknown };
  if (typeof data.number !== 'number') throw new GitHubError('GitHub answered without an issue number');
  return { number: data.number };
}
