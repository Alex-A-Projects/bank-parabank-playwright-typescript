import { test as base } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import { baseURL, dbAppBaseURL, dbConfig, TEST_ENV } from '../../shared/env';
import type { TestEnv } from '../../shared/env';
import { assertKnownTags } from '../../shared/tags';
import { featureGateSkipReason, mutatingTestSkipReason } from '../../shared/policy';

/**
 * Core fixture layer - infrastructure shared by every database test.
 *
 * The database suite gates on `TEST_ENV`, not on `API_ENV`: the
 * database belongs to the suite environment, and the feature matrix
 * disables every `db-*` feature outside `local` (the public cloud demo
 * does not expose its HSQLDB port).
 */

/** A snapshot of the environment this run resolved to. */
export interface DbAppConfig {
  /** The suite environment - decides whether the database is reachable. */
  testEnv: TestEnv;
  /** Base URL the browser navigates to. */
  baseURL: string;
  /** Base URL of the app instance that owns the database. */
  dbAppBaseURL: string;
  /** The JDBC URL of the database under test. */
  jdbcUrl: string;
}

export interface DbCoreFixtures {
  appConfig: DbAppConfig;
  /** Automatic fixture - not requested by tests, runs before every test. */
  _tagGate: void;
}

export const coreFixtures = {
  /**
   * Tag gate.
   *
   * Runs automatically before every test:
   *   - an unknown selection tag throws, so a typo fails loudly instead
   *     of silently never matching a `--grep`;
   *   - a feature tag for a feature that is disabled in the current
   *     environment skips the test with the reason recorded;
   *   - a feature tag for a feature that does not exist at all throws;
   *   - a test tagged `@mutating` skips outside the local container,
   *     because a shared instance must not be written to.
   */
  _tagGate: [
    async (
      {},
      use: (value: void) => Promise<void>,
      testInfo: TestInfo,
    ) => {
      assertKnownTags(testInfo.tags);
      const reason =
        featureGateSkipReason(testInfo.tags, TEST_ENV) ??
        mutatingTestSkipReason(testInfo.tags, TEST_ENV);
      if (reason) {
        testInfo.skip(true, reason);
      }
      await use(undefined);
    },
    { auto: true, title: 'tag-gate' },
  ],

  appConfig: async ({}, use: (value: DbAppConfig) => Promise<void>) => {
    await use({
      testEnv: TEST_ENV,
      baseURL,
      dbAppBaseURL,
      jdbcUrl: dbConfig.jdbcUrl,
    });
  },
} satisfies Parameters<typeof base.extend<DbCoreFixtures>>[0];
