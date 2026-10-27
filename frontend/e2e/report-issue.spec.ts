import { expect, test } from '@playwright/test';

import { listFiles, resetEmulators } from './emulators';
import { signInAndSetUp } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

// Without a GitHub token, the emulator answers with a fake issue #1.
test('a user reports an issue from the sheet on the Profile tab', async ({ page }) => {
  await signInAndSetUp(page);
  await page.getByRole('tab', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Report an issue' }).click();

  const send = page.getByRole('button', { name: 'Send' });
  await expect(send).toBeDisabled();
  await page.getByLabel('Issue title').fill('Chart is empty');
  await page.getByLabel('Issue description').fill('The weight chart shows no points.');
  await send.click();

  await expect(page.getByText('Issue #1 created. Thank you.')).toBeVisible();
  await expect(page.getByLabel('Issue title')).toHaveCount(0);
});

test('a user adds phone screenshots to an issue', async ({ page }) => {
  await signInAndSetUp(page);
  // A screenshot of the app at phone size, like the ones users send.
  const screenshot = { name: 'IMG_0001.PNG', mimeType: 'image/png', buffer: await page.screenshot() };
  await page.getByRole('tab', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'Report an issue' }).click();
  await page.getByLabel('Issue title').fill('Chart is empty');

  await page.getByLabel('Screenshot files').setInputFiles([screenshot, { ...screenshot, name: 'IMG_0002.PNG' }]);
  await expect(page.getByLabel('Screenshot 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove screenshot 2' }).click();
  await expect(page.getByLabel('Screenshot 2', { exact: true })).toHaveCount(0);

  const before = await listFiles('issues/');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Issue #1 created. Thank you.')).toBeVisible();

  const uploaded = (await listFiles('issues/')).filter((f) => !before.some((b) => b.name === f.name));
  expect(uploaded).toHaveLength(1);
  expect(uploaded[0]).toMatchObject({ contentType: 'image/jpeg' });
  expect(uploaded[0].size).toBeLessThan(screenshot.buffer.length);
});
