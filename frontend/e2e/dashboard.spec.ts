import { expect, test } from '@playwright/test';

import { resetEmulators } from './emulators';
import { openPlusOption, signInAndSetUp } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

test('the Dashboard follows the log and the targets from Profile', async ({ page }) => {
  await signInAndSetUp(page);
  await expect(page.getByLabel('Calories: 0 of 2200')).toBeVisible();

  // Log 100 g of banana (89 kcal) for today.
  await openPlusOption(page, 'Log food');
  await page.getByLabel('Search foods').fill('banana');
  await page.getByRole('button', { name: /^Banana\s+89 kcal/ }).click();
  await page.getByRole('button', { name: 'Log to Today' }).click();
  // Logging returns to the search, so close it to see the Dashboard.
  await expect(page.getByLabel('Search foods')).toHaveValue('');
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByLabel('Calories: 89 of 2200')).toBeVisible();
  await page.getByRole('radio', { name: 'Remaining' }).click();
  await expect(page.getByLabel('Calories: 2,111 left')).toBeVisible();

  // A new calorie target in Profile shows on the Dashboard.
  await page.getByRole('tab', { name: 'Profile' }).click();
  await page.getByRole('textbox', { name: 'Calories' }).fill('2000');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
  await page.getByRole('tab', { name: 'Dashboard' }).click();
  await expect(page.getByLabel('Calories: 1,911 left')).toBeVisible();

  await page.getByRole('button', { name: 'Weight trend' }).click();
  await expect(page.getByRole('button', { name: 'Log weight' })).toBeVisible();
});
