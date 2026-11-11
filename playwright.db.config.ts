import { defineConfig } from '@playwright/test';
import { dbAppBaseURL } from './src/shared/env';
import { commonUse, forbidOnly, reporters, retries } from './src/shared/playwright.shared';

/**
 * Database suite configuration.
 *
 * The suite verifies that what the application writes really lands in
 * ParaBank's HSQLDB. It writes through the running application and
 * reads through JDBC, so it always drives the local instance - the one
 * that owns the database.
 *
 * The global setup waits for the application's schema to exist before
 * the first test runs (ParaBank creates it lazily).
 *
 * The timeout is generous because every query starts a JVM: the JDBC
 * bridge is a short-lived child process, not a pooled connection.
 */
export default defineConfig({
  testDir: './tests-db',
  globalSetup: './src/db/global-setup.ts',
  fullyParallel: false,
  forbidOnly,
  retries,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  reporter: reporters('db'),
  use: {
    ...commonUse,
    baseURL: dbAppBaseURL,
  },
  projects: [
    {
      name: 'db',
      use: {},
    },
  ],
});
