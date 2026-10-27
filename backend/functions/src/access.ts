// Who can create an account: the emails in config/access, which the owner edits in the Firebase console.

export const ACCESS_DOC = 'config/access';

/** True when `email` is in `invited`, ignoring case. Fails closed: a missing or invalid list invites no one. */
export function isInvited(email: string | undefined, invited: unknown): boolean {
  if (!email) return false;
  if (!Array.isArray(invited)) return false;

  const normalized = email.trim().toLowerCase();
  return invited.some((entry) => typeof entry === 'string' && entry.trim().toLowerCase() === normalized);
}
