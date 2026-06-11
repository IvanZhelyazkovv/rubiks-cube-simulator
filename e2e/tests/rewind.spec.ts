import { expect, test } from '@playwright/test';

import { openApp } from './helpers';

test('rewind replays the inverse of a scramble back to solved', async ({ page }) => {
  await openApp(page);

  await page.getByRole('button', { name: 'Scramble' }).click();
  await expect(page.getByText('25 moves')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('solved-badge')).not.toBeVisible();

  await page.getByRole('button', { name: 'Rewind' }).click();

  // Twenty-five fast inverse turns play back to the solved cube.
  await expect(page.getByText('0 moves')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('solved-badge')).toBeVisible();
});
