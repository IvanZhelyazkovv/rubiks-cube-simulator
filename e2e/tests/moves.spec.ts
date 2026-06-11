import { expect, test } from '@playwright/test';

import { openApp } from './helpers';

test('keyboard turns apply and undo reverts them', async ({ page }) => {
  await openApp(page);

  await page.keyboard.press('f');
  await expect(page.getByText('1 move', { exact: true })).toBeVisible();

  await page.keyboard.press('Shift+R');
  await expect(page.getByText('2 moves')).toBeVisible();
  await expect(page.getByTestId('history-panel').getByText("R'")).toBeVisible();

  const undo = page.getByRole('button', { name: 'Undo' });
  await undo.click();
  await expect(page.getByText('1 move', { exact: true })).toBeVisible();
  await undo.click();

  await expect(page.getByText('0 moves')).toBeVisible();
  await expect(page.getByTestId('solved-badge')).toBeVisible({ timeout: 10_000 });
});

test('a typed sequence applies and reset restores the solved cube', async ({ page }) => {
  await openApp(page);

  await page.getByLabel('Move sequence').fill("R U R' U'");
  await page.keyboard.press('Enter');

  await expect(page.getByText('4 moves')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('solved-badge')).not.toBeVisible();

  const reset = page.getByRole('button', { name: 'Reset' });
  await expect(reset).toBeEnabled({ timeout: 20_000 });
  await reset.click();

  await expect(page.getByText('0 moves')).toBeVisible();
  await expect(page.getByTestId('solved-badge')).toBeVisible();
});

test('invalid notation is rejected with a position-aware message', async ({ page }) => {
  await openApp(page);

  await page.getByLabel('Move sequence').fill('F X');

  await expect(page.getByRole('alert')).toContainText("Unexpected 'X'");
  await expect(page.getByRole('button', { name: 'Apply' })).toBeDisabled();
});
