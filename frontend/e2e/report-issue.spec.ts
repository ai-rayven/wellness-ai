import { expect, test } from '@playwright/test';

import { resetEmulators } from './emulators';
import { signInAndSetUp } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

// Without a GitHub token, the emulator answers with a fake issue #1.
test('a user reports an issue from the Profile tab', async ({ page }) => {
  await signInAndSetUp(page);
  await page.getByRole('tab', { name: 'Profile' }).click();

  const send = page.getByRole('button', { name: 'Send' });
  await expect(send).toBeDisabled();
  await page.getByLabel('Issue title').fill('Chart is empty');
  await page.getByLabel('Issue description').fill('The weight chart shows no points.');
  await send.click();

  await expect(page.getByText('Issue #1 created. Thank you.')).toBeVisible();
  await expect(page.getByLabel('Issue title')).toHaveValue('');
});
