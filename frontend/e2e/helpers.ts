import { expect, type Page } from '@playwright/test';

import { INVITED_EMAIL } from './emulators';

/** Signs in through the Auth emulator's Google popup, as a new account with `email` or the first existing account. */
export async function signInWithGoogle(page: Page, account: 'new' | 'existing', email = INVITED_EMAIL) {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const popup = await popupPromise;
  // The emulator page shows its buttons before its script handles clicks.
  await popup.waitForLoadState('load');
  if (account === 'new') {
    await popup.getByRole('button', { name: 'Add new account' }).click();
    await popup.getByRole('button', { name: 'Auto-generate user information' }).click();
    await popup.getByLabel('Email').fill(email);
    await popup.getByRole('button', { name: 'Sign in with Google.com' }).click();
  } else {
    await popup.locator('li').first().click();
  }
  await popup.waitForEvent('close');
}

/** Signs in a new account and finishes setup with the default targets. */
export async function signInAndSetUp(page: Page) {
  await page.goto('/');
  await signInWithGoogle(page, 'new');
  await page.getByRole('radio', { name: 'Female' }).click();
  await page.getByLabel('Birth date').fill('1990-06-15');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Dashboard').first()).toBeVisible();
}

/** Opens the + sheet and picks an option. Clicks + again if a click comes before the screen handles it. */
export async function openPlusOption(page: Page, option: 'Log food' | 'Log weight') {
  const button = page.getByRole('button', { name: option, exact: true });
  await expect(async () => {
    await page.getByRole('button', { name: 'Log food or weight' }).click();
    await expect(button).toBeVisible({ timeout: 2000 });
  }).toPass();
  await button.click();
}
