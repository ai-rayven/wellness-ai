import { expect, test } from '@playwright/test';

import { resetEmulators } from './emulators';
import { openPlusOption, signInAndSetUp, typeOnNumberPad } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('log weights in the sheet, see the trend, change one and delete one', async ({ page }) => {
  await signInAndSetUp(page);

  // From the + button, the sheet opens over the Dashboard, on today.
  await openPlusOption(page, 'Log weight');
  await typeOnNumberPad(page, '183.4');
  await expect(page.getByLabel('Weight', { exact: true })).toHaveText('183.4');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Weight trend' })).toContainText('183.4');

  // The Dashboard card opens the Weight screen. Its query must not need an index (it once did).
  await page.getByRole('button', { name: 'Weight trend' }).click();
  await expect(page.getByText('Log at least two days to see a trend.')).toBeVisible();
  await page.getByRole('button', { name: 'Log weight' }).click();
  await page.getByLabel('Date', { exact: true }).fill(isoDaysAgo(1));
  await typeOnNumberPad(page, '184');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('-0.6 lb')).toBeVisible();
  await expect(page.getByLabel('Weight, last 30 days')).toBeVisible();

  // A logged day opens with its weight. The first key replaces it, and a save replaces the entry.
  await page.getByRole('button', { name: 'Change Today' }).click();
  await expect(page.getByLabel('Weight', { exact: true })).toHaveText('183.4');
  await typeOnNumberPad(page, '183');
  await expect(page.getByLabel('Weight', { exact: true })).toHaveText('183');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('-1 lb')).toBeVisible();

  await page.getByRole('button', { name: 'Change Yesterday' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('184 lb', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Log at least two days to see a trend.')).toBeVisible();
});
