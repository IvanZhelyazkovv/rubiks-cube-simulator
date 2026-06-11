import { expect, test } from '@playwright/test';

import { openApp } from './helpers';

test('the layout works on a phone: no horizontal overflow, touch moves apply', async ({
  page,
}) => {
  await openApp(page);

  // The page must not scroll sideways on a narrow viewport.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  // The 3D cube and the exploded view are both on screen.
  await expect(page.locator('section[aria-label="3D cube"]')).toBeVisible();
  await expect(page.getByTestId('net-view')).toBeVisible();

  // A tap on the move pad applies a turn.
  await page.getByRole('button', { name: 'F', exact: true }).tap();
  await expect(page.getByText('1 move', { exact: true })).toBeVisible({ timeout: 10_000 });
});
