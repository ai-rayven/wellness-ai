import { describe, expect, it } from '@jest/globals';

import { isInvited } from './access';

describe('isInvited', () => {
  it('accepts an invited email, ignoring case and spaces', () => {
    expect(isInvited('Ana@Example.com', ['bo@example.com', ' ana@example.com '])).toBe(true);
  });

  it('rejects an email that is not in the list', () => {
    expect(isInvited('eve@example.com', ['ana@example.com'])).toBe(false);
  });

  it.each([undefined, ''])('rejects the email %p', (email) => {
    expect(isInvited(email, ['ana@example.com'])).toBe(false);
  });

  it.each([undefined, null, 'ana@example.com', {}, [42]])('rejects all emails for the list %p', (invited) => {
    expect(isInvited('ana@example.com', invited)).toBe(false);
  });
});
