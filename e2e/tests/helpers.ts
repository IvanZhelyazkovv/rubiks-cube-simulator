import { expect, type Page } from '@playwright/test';

/** Face rows in the app's letter notation, top row first. */
export type ExpectedFaces = Record<string, string[]>;

/**
 * The expected exploded view after the task's verification sequence
 * F R' U B' L D' — the same expectation pinned by the backend acceptance test.
 */
export const TASK_RESULT: ExpectedFaces = {
  up: ['ROG', 'BWW', 'BBB'],
  left: ['GYY', 'OOG', 'BGO'],
  front: ['ORR', 'OGW', 'WWW'],
  right: ['YBO', 'RRW', 'OYR'],
  back: ['YBW', 'OBY', 'YYW'],
  down: ['GGB', 'RYR', 'RGG'],
};

/** Asserts every sticker of the exploded view, face by face. */
export async function expectNet(page: Page, faces: ExpectedFaces): Promise<void> {
  for (const [face, rows] of Object.entries(faces)) {
    for (const [rowIndex, row] of rows.entries()) {
      for (const [columnIndex, letter] of [...row].entries()) {
        await expect(
          page.getByTestId(`net-${face}-${rowIndex}-${columnIndex}`),
          `${face} sticker (${rowIndex},${columnIndex})`,
        ).toHaveAttribute('data-letter', letter);
      }
    }
  }
}

/** Waits for the app to finish creating its session and render the cube. */
export async function openApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('net-view')).toBeVisible();
  await expect(page.getByTestId('solved-badge')).toBeVisible();
}
