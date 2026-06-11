import { expect, test } from '@playwright/test';

import { TASK_RESULT, expectNet, openApp } from './helpers';

// The exploded view is what this test is about; skipping the turn animations
// keeps it stable when parallel workers share a software GPU.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('the task sequence produces the expected exploded view, sticker by sticker', async ({
  page,
}) => {
  await openApp(page);

  const runButton = page.getByRole('button', { name: "Run F R' U B' L D'" });
  await runButton.click();

  // The history reports all six moves once the final server state is in,
  // and the run button re-enables when the run is done.
  await expect(page.getByText('6 moves')).toBeVisible({ timeout: 15_000 });
  await expect(runButton).toBeEnabled({ timeout: 15_000 });

  await expect(page.getByTestId('solved-badge')).not.toBeVisible();
  await expectNet(page, TASK_RESULT);
});
