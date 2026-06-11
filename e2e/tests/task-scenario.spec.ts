import { expect, test } from '@playwright/test';

import { TASK_RESULT, expectNet, openApp } from './helpers';

test('the task sequence produces the expected exploded view, sticker by sticker', async ({
  page,
}) => {
  await openApp(page);

  const runButton = page.getByRole('button', { name: "Run F R' U B' L D'" });
  await runButton.click();

  // Six animated turns play; the history reports all six once the final
  // server state is in, and the run button re-enables when the run is done.
  await expect(page.getByText('6 moves')).toBeVisible({ timeout: 15_000 });
  await expect(runButton).toBeEnabled({ timeout: 15_000 });

  await expect(page.getByTestId('solved-badge')).not.toBeVisible();
  await expectNet(page, TASK_RESULT);
});
