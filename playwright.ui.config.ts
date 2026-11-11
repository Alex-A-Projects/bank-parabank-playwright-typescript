import { defineConfig, devices } from '@playwright/test';
import { baseURL } from './src/shared/env';
import { commonUse, forbidOnly, reporters, retries } from './src/shared/playwright.shared';

/**
 * UI suite configuration.
 *
 * The browser navigates to the environment `TEST_ENV` selects; the URL
 * comes from the environment, never from a literal in this file.
 *
 * The suite runs single-threaded on purpose: several tests change the
 * demo customer's data (the admin page re-seeds the shared dataset), and
 * parallel workers would interleave those changes.
 */
export default defineConfig({
  testDir: './tests-ui',
  fullyParallel: false,
  forbidOnly,
  retries,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  reporter: reporters('ui'),
  reportSlowTests: { max: 5, threshold: 30_000 },
  use: {
    ...commonUse,
    baseURL,
  },
  projects: [
    {
      name: 'ui-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
