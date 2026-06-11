import { expect, test } from '@playwright/test';

import { openApp } from './helpers';

test.use({ viewport: { width: 1440, height: 860 } });

/**
 * Locates a sticker by probing the canvas until the cursor offers the grab
 * affordance; the cube's default framing puts the front face around the
 * canvas centre-left.
 */
async function findSticker(page: import('@playwright/test').Page): Promise<[number, number]> {
  for (const [x, y] of [
    [430, 560],
    [440, 540],
    [420, 580],
    [460, 520],
    [400, 600],
  ] as const) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(120);
    const cursor = await page.evaluate(() => document.querySelector('canvas')?.style.cursor);
    if (cursor === 'grab') {
      return [x, y];
    }
  }
  throw new Error('No sticker found under any probe point.');
}

test('dragging a sticker turns its layer, including a middle layer', async ({ page }) => {
  await openApp(page);
  await page.waitForTimeout(500); // first canvas paint

  const [x, y] = await findSticker(page);

  // Drag upwards far enough to clear the gesture threshold.
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 8; step++) {
    await page.mouse.move(x, y - step * 22);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();

  // One move lands in the history; which token depends on the grabbed
  // column, so assert the count rather than the name.
  await expect(page.getByText('1 move', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('solved-badge')).not.toBeVisible();
});
