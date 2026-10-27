import { expect, test, type Page } from '@playwright/test';

import { resetEmulators } from './emulators';
import { openPlusOption, signInAndSetUp, typeOnNumberPad } from './helpers';

// Phone screenshots of the main screens with some data, for review in the PR.
// CI posts them in a PR comment (scripts/post-screens.sh).
const DIR = 'screens';

test.beforeEach(async () => {
  await resetEmulators();
});

async function shoot(page: Page, name: string) {
  // The sheets slide in. Wait for the animations to end.
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/${name}.png` });
}

test('screenshots of the main screens', async ({ page }) => {
  await signInAndSetUp(page);
  await openPlusOption(page, 'Log food');
  await page.getByLabel('Search foods').fill('banana');
  await page.getByRole('button', { name: /^Banana\s+89 kcal/ }).click();
  await page.getByRole('button', { name: 'Log to Today' }).click();
  await expect(page.getByLabel('Calories: 89 of 2200')).toBeVisible();
  await shoot(page, '1-dashboard');

  await page.getByRole('tab', { name: 'Food Log' }).click();
  await expect(page.getByText('Banana')).toBeVisible();
  await shoot(page, '2-food-log');

  await openPlusOption(page, 'Log weight');
  await typeOnNumberPad(page, '183.4');
  await shoot(page, '3-weight-sheet');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('tab', { name: 'Profile' }).click();
  await expect(page.getByText('Account')).toBeAttached();
  await shoot(page, '4-profile');

  await page.getByRole('button', { name: 'Report an issue' }).click();
  await expect(page.getByLabel('Issue title')).toBeVisible();
  await shoot(page, '5-issue-sheet');
});
