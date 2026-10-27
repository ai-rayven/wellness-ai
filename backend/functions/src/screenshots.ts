// Screenshots for issue reports: the app uploads them to Cloud Storage, see backend/storage.rules.

export const MAX_SCREENSHOTS = 3;

/** True when `path` is where `uid` uploads a screenshot: issues/{uid}/{uuid}.jpg */
export function isScreenshotPath(path: unknown, uid: string): path is string {
  if (!uid) throw new RangeError('uid must not be empty');
  if (typeof path !== 'string') return false;

  const [folder, owner, file, ...rest] = path.split('/');
  return folder === 'issues' && owner === uid && rest.length === 0 && /^[0-9a-f-]{36}\.jpg$/.test(file ?? '');
}
