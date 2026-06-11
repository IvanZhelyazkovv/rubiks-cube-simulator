import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against the real stack: the ASP.NET API serving the built
 * web UI on port 5180. Playwright starts the API itself; build the UI first
 * (`npm run build` in apps/web) so wwwroot is up to date.
 */
export default defineConfig({
  testDir: './tests',
  // CI runners render WebGL in software; give animated scenarios headroom.
  timeout: 60_000,
  fullyParallel: true,
  // Each test runs a software-rendered WebGL scene; too many at once starve
  // the animation frames the specs wait on.
  workers: 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    // Headless chromium needs software WebGL for the 3D cube.
    launchOptions: {
      args: ['--enable-unsafe-swiftshader'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    // Rebuild the UI first so local runs never test a stale bundle. CI builds
    // the UI in its own step; the rebuild here is cheap and idempotent.
    command: 'npm --prefix ../apps/web run build && dotnet run --project ../src/RubiksCube.Api',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
