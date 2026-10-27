import { expect, test, type Page } from '@playwright/test';

import { listDocuments, resetEmulators } from './emulators';

test.beforeEach(async () => {
  await resetEmulators();
});

/** Signs in through the Auth emulator's Google popup, as a new or an existing account. */
async function signInWithGoogle(page: Page, account: 'new' | 'existing') {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const popup = await popupPromise;
  // The emulator page shows its buttons before its script handles clicks.
  await popup.waitForLoadState('load');
  if (account === 'new') {
    await popup.getByRole('button', { name: 'Add new account' }).click();
    await popup.getByRole('button', { name: 'Auto-generate user information' }).click();
    await popup.getByRole('button', { name: 'Sign in with Google.com' }).click();
  } else {
    await popup.locator('li').first().click();
  }
  await popup.waitForEvent('close');
}

test('a new user signs in, sets up the profile and signs out', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, 'new');

  await expect(page.getByText('Set up your profile')).toBeVisible();
  const continueButton = page.getByRole('button', { name: 'Continue' });
  await expect(continueButton).toBeDisabled();
  await expect(page.getByText('Choose your sex.')).toBeVisible();

  await page.getByRole('radio', { name: 'Female' }).click();
  await page.getByLabel('Birth date').fill('1990-06-15');
  await expect(page.getByText(/^Age \d+$/)).toBeVisible();
  await page.getByLabel('Protein').fill('160');
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await expect(page.getByText('Daily target: 2200 kcal')).toBeVisible();

  const [user] = await listDocuments('users');
  expect(user.fields).toMatchObject({
    sex: { stringValue: 'female' },
    birthDate: { stringValue: '1990-06-15' },
    targets: {
      mapValue: {
        fields: {
          kcal: { integerValue: '2200' },
          proteinG: { integerValue: '160' },
          carbsG: { integerValue: '220' },
          fatG: { integerValue: '70' },
        },
      },
    },
  });
  expect(Object.keys(user.fields).sort()).toEqual(['birthDate', 'createdAt', 'displayName', 'email', 'sex', 'targets']);

  // The session survives a reload.
  await page.reload();
  await expect(page.getByText('Daily target: 2200 kcal')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

  // Signing in again skips setup.
  await signInWithGoogle(page, 'existing');
  await expect(page.getByText('Daily target: 2200 kcal')).toBeVisible();
});

test('setup rejects a birth date in the future', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, 'new');

  await page.getByRole('radio', { name: 'Male', exact: true }).click();
  await page.getByLabel('Birth date').fill('2999-01-01');
  await expect(page.getByText('Birth date cannot be in the future.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});
