import { expect, test } from '@playwright/test';

import { resetEmulators } from './emulators';
import { signInAndSetUp, swipeUp } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

test('a finger swipe scrolls the Profile tab to its last card', async ({ page }) => {
  await signInAndSetUp(page);
  await page.getByRole('tab', { name: 'Profile' }).click();
  const last = page.getByText('Report an issue');
  await expect(page.getByText('Account')).toBeVisible();
  await expect(last).toBeAttached();
  await expect(last).not.toBeInViewport();

  await swipeUp(page);
  await swipeUp(page);
  await expect(last).toBeInViewport();
});
