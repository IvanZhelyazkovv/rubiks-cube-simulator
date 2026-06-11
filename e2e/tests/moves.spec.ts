import { expect, test } from '@playwright/test';

import { openApp } from './helpers';

// These specs verify move/undo/reset state handling, not animation playback
// (the drag spec covers a real animated turn). Reduced motion keeps them
// deterministic on machines that render WebGL in software.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('keyboard turns apply and undo reverts them', async ({ page }) => {
  await openApp(page);

  // Animated turns render in software on CI; every step gets headroom.
  await page.keyboard.press('f');
  await expect(page.getByText('1 move', { exact: true })).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press('Shift+R');
  await expect(page.getByText('2 moves', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('history-panel').getByText("R'")).toBeVisible();

  const undo = page.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeEnabled({ timeout: 15_000 });
  await undo.click();
  await expect(page.getByText('1 move', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(undo).toBeEnabled({ timeout: 15_000 });
  await undo.click();

  await expect(page.getByText('0 moves', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('solved-badge')).toBeVisible({ timeout: 15_000 });
});

test('a typed sequence applies and reset restores the solved cube', async ({ page }) => {
  await openApp(page);

  await page.getByLabel('Move sequence').fill("R U R' U'");
  await page.keyboard.press('Enter');

  await expect(page.getByText('4 moves', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('solved-badge')).not.toBeVisible();

  const reset = page.getByRole('button', { name: 'Reset' });
  await expect(reset).toBeEnabled({ timeout: 20_000 });
  await reset.click();

  await expect(page.getByText('0 moves', { exact: true })).toBeVisible();
  await expect(page.getByTestId('solved-badge')).toBeVisible();
});

test('invalid notation is rejected with a position-aware message', async ({ page }) => {
  await openApp(page);

  await page.getByLabel('Move sequence').fill('F X');

  await expect(page.getByRole('alert')).toContainText("Unexpected 'X'");
  await expect(page.getByRole('button', { name: 'Apply' })).toBeDisabled();
});
