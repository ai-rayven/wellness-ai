import { expect, test } from '@playwright/test';

import { listDocuments, resetEmulators } from './emulators';
import { openPlusOption, signInAndSetUp } from './helpers';

test.beforeEach(async () => {
  await resetEmulators();
});

test('log a food, edit it and delete it', async ({ page }) => {
  await signInAndSetUp(page);

  await openPlusOption(page, 'Log food');
  await page.getByLabel('Search foods').fill('rolled oats');
  await page.getByRole('button', { name: /^Rolled oats\s+379 kcal/ }).click();

  await page.getByLabel('Amount').fill('60');
  await page.getByRole('radio', { name: 'Breakfast' }).click();
  await page.getByRole('button', { name: 'Log to Today' }).click();

  await page.getByRole('tab', { name: 'Food Log' }).click();
  await expect(page.getByText('2,200 left')).toHaveCount(0);
  await expect(page.getByText('1,973 left')).toBeVisible();
  await expect(page.getByText('60 g')).toBeVisible();

  const [entry] = await listDocuments(`users/${await uid(page)}/logEntries`);
  expect(entry.fields).toMatchObject({
    meal: { stringValue: 'breakfast' },
    grams: { integerValue: '60' },
    foodId: { stringValue: 'mock_rolled-oats' },
  });

  await page.getByRole('button', { name: /Rolled oats\s+60 g/ }).click();
  await page.getByLabel('Amount').fill('100');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('1,821 left')).toBeVisible();

  // The logged food is now a recent food.
  await page.getByRole('button', { name: 'Add food to Lunch' }).click();
  await expect(page.getByText('Recent')).toBeVisible();
  await page.getByRole('button', { name: /^Rolled oats/ }).click();
  // The amount defaults to the latest logged grams.
  await expect(page.getByLabel('Amount')).toHaveValue('100');
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: /Rolled oats\s+100 g/ }).click();
  await page.getByRole('button', { name: 'Delete entry' }).click();
  await expect(page.getByText('2,200 left')).toBeVisible();
});

/** The signed-in user's uid, from the only users/{uid} document. */
async function uid(page: import('@playwright/test').Page): Promise<string> {
  await expect.poll(async () => (await listDocuments('users')).length).toBe(1);
  const [user] = await listDocuments('users');
  return user.name.split('/').pop()!;
}
