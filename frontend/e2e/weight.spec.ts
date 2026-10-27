import { expect, test } from '@playwright/test';

import { resetEmulators } from './emulators';
import { signInAndSetUp } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('log weights for two days, see the trend and delete one', async ({ page }) => {
  await signInAndSetUp(page);
  await page.getByRole('button', { name: 'Log food or weight' }).click();
  await page.getByRole('button', { name: 'Log weight' }).click();

  await expect(page.getByText('Log at least two days to see a trend.')).toBeVisible();
  await page.getByLabel('Date', { exact: true }).fill(isoDaysAgo(1));
  await page.getByLabel('Weight', { exact: true }).fill('184');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('184 lb', { exact: true })).toBeVisible();

  await page.getByLabel('Date', { exact: true }).fill(isoDaysAgo(0));
  await page.getByLabel('Weight', { exact: true }).fill('183.4');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('183.4 lb', { exact: true })).toBeVisible();
  await expect(page.getByText('-0.6 lb')).toBeVisible();
  await expect(page.getByLabel('Weight, last 30 days')).toBeVisible();

  // A second save for the same day replaces it.
  await page.getByRole('button', { name: 'Edit Today' }).click();
  await expect(page.getByText('Replaces 183.4 lb already logged for Today.')).toBeVisible();

  await page.getByRole('button', { name: 'Delete Yesterday' }).click();
  await expect(page.getByText('184 lb', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Log at least two days to see a trend.')).toBeVisible();
});
