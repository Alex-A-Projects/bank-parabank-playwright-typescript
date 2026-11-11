import { test as base } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import { API_ENV, baseURL, envAxesDiffer, TEST_ENV } from '../../shared/env';
import type { TestEnv } from '../../shared/env';
import { assertKnownTags } from '../../shared/tags';
import { featureGateSkipReason, mutatingTestSkipReason } from '../../shared/policy';

/**
 * Core fixture layer - infrastructure shared by every UI test.
 *
 * Two independent fixtures live here:
 *
 *   - `_tagGate`  - an automatic fixture that validates the test's tags
 *                   and applies the feature-gating matrix.
 *   - `appConfig` - a read-only snapshot of the resolved run environment,
 *                   so a test can branch on the environment without
 *                   re-reading `process.env`.
 *
 * Dependency direction: core -> pages -> flows.
 */

/** A snapshot of the environment this run resolved to. */
export interface AppConfig {
  /** The suite environment - drives browser navigation. */
  testEnv: TestEnv;
  /** The server/API environment - drives the API clients only. */
  apiEnv: TestEnv;
  /** Base URL the browser navigates to. */
  baseURL: string;
  /** True when the two env axes point at different backends. */
  axesDiffer: boolean;
}

export interface CoreFixtures {
  appConfig: AppConfig;
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

  appConfig: async ({}, use: (value: AppConfig) => Promise<void>) => {
    await use({
      testEnv: TEST_ENV,
      apiEnv: API_ENV,
      baseURL,
      axesDiffer: envAxesDiffer(),
    });
  },
} satisfies Parameters<typeof base.extend<CoreFixtures>>[0];
