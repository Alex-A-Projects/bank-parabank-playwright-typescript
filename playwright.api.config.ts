import { defineConfig } from '@playwright/test';
import { apiBaseURL } from './src/shared/env';
import { commonUse, forbidOnly, reporters, retries } from './src/shared/playwright.shared';

/**
 * API suite configuration.
 *
 * The API clients talk to the environment `API_ENV` selects. The suite
 * runs headless and without a browser: the built-in `request` fixture is
 * the only transport it uses.
 *
 * Single-threaded on purpose: the database-lifecycle tests wipe and
 * re-seed the shared dataset, so they must not run next to anything
 * else.
 */
export default defineConfig({
  testDir: './tests-api',
  fullyParallel: false,
  forbidOnly,
  retries,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: reporters('api'),
  use: {
    ...commonUse,
    baseURL: apiBaseURL,
  },
  projects: [
    {
      name: 'api',
      use: {},
    },
  ],
});
