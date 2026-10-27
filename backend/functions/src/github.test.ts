import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { GitHubError, createGitHubIssue } from './github';

const INPUT = { title: ' Chart is empty ', description: ' Steps to see it. ' };

describe('createGitHubIssue', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('posts the issue with the token and returns its number', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ number: 7 }));

    const issue = await createGitHubIssue(INPUT, 'token-1');

    expect(issue).toEqual({ number: 7 });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/ai-rayven/wellness-ai/issues');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-1');
    expect(JSON.parse(String(init?.body))).toEqual({
      title: 'Chart is empty',
      body: 'Steps to see it.\n\n---\nReported from the Sano app.',
    });
  });

  it('throws a GitHubError when GitHub answers with an error', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 401 }));
    await expect(createGitHubIssue(INPUT, 'token-1')).rejects.toThrow(new GitHubError('GitHub answered 401'));
  });

  it('throws a GitHubError when the answer has no issue', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({}));
    await expect(createGitHubIssue(INPUT, 'token-1')).rejects.toBeInstanceOf(GitHubError);
  });

  it('rejects an empty title or token before calling GitHub', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch');
    await expect(createGitHubIssue({ ...INPUT, title: ' ' }, 'token-1')).rejects.toBeInstanceOf(RangeError);
    await expect(createGitHubIssue(INPUT, '')).rejects.toBeInstanceOf(RangeError);
    expect(fetch).not.toHaveBeenCalled();
  });
});
