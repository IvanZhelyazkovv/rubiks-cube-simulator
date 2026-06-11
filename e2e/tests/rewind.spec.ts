import { expect, test } from '@playwright/test';

import { openApp } from './helpers';

// Twenty-five animated turns are too slow for CI's software renderer, so this
// scenario runs with the reduced-motion preference — which also verifies that
// the app honours it by committing each turn instantly, with no animation.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('rewind replays the inverse of a scramble back to solved', async ({ page }) => {
  await openApp(page);

  await page.getByRole('button', { name: 'Scramble' }).click();
  await expect(page.getByText('25 moves')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('solved-badge')).not.toBeVisible();

  await page.getByRole('button', { name: 'Rewind' }).click();

  await expect(page.getByText('0 moves')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('solved-badge')).toBeVisible({ timeout: 10_000 });
});
