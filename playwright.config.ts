import { defineConfig, devices } from '@playwright/test';
import { apiBaseURL, baseURL, dbAppBaseURL } from './src/shared/env';
import { commonUse, forbidOnly, reporters, retries } from './src/shared/playwright.shared';

/**
 * Unified root configuration.
 *
 * This file exists so the three suites can be run - and debugged - in
 * one go, which is what the IDE's test explorer expects:
 *
 *     npx playwright test                       # all three suites
 *     npx playwright test --project=ui          # one suite
 *
 * The individual suite configs (`playwright.ui.config.ts`,
 * `playwright.api.config.ts`, `playwright.db.config.ts`) remain the
 * canonical way to run a suite on its own - they carry the suite's own
 * timeout, global setup and report directories. This file mirrors that
 * setup as three projects.
 */
export default defineConfig({
  fullyParallel: false,
  forbidOnly,
  retries,
  workers: 1,
  reporter: reporters('ui'),
  /**
   * The database readiness wait. It is a no-op unless the `db-*`
   * features are enabled for the current environment, so running the
   * unified config against the cloud demo does not insist on a
   * database the suite is not going to use.
   */
  globalSetup: './src/db/global-setup.ts',
  use: {
    ...commonUse,
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests-ui',
      timeout: 120_000,
      use: {
        ...devices['Desktop Chrome'],
        ...commonUse,
        baseURL,
      },
    },
    {
      name: 'api',
      testDir: './tests-api',
      timeout: 60_000,
      use: {
        ...commonUse,
        baseURL: apiBaseURL,
      },
    },
    {
      name: 'db',
      testDir: './tests-db',
      timeout: 120_000,
      use: {
        ...commonUse,
        baseURL: dbAppBaseURL,
      },
    },
  ],
});
