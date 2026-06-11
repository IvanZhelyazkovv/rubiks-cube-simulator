// Captures the README screenshot: the web UI after running the task's
// verification sequence. Requires the API to be serving the built UI on
// port 5180. Usage: node capture-screenshot.mjs
import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

await page.goto('http://localhost:5180/');
await page.getByTestId('net-view').waitFor();
await page.getByTestId('solved-badge').waitFor();

const runButton = page.getByRole('button', { name: "Run F R' U B' L D'" });
await runButton.click();
await page.getByText('6 moves').waitFor({ timeout: 30_000 });

// The run is over once its button re-enables and the progress badge clears.
await expect(runButton).toBeEnabled({ timeout: 30_000 });
await expect(page.getByTestId('run-progress')).not.toBeVisible({ timeout: 10_000 });

// Give the final turn's easing a beat to settle before the shot.
await page.waitForTimeout(700);
await page.screenshot({ path: '../docs/web-ui.png' });

await browser.close();
console.log('Saved docs/web-ui.png');
