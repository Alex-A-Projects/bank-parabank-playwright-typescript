import { test as base } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import { API_ENV, apiBaseURL, baseURL, envAxesDiffer, TEST_ENV } from '../../shared/env';
import type { TestEnv } from '../../shared/env';
import { assertKnownTags } from '../../shared/tags';
import { featureGateSkipReason, mutatingTestSkipReason } from '../../shared/policy';
import { strategyFactory } from '../strategies/strategy.factory';
import type { StrategyId } from '../strategies/parabank-strategy';

/**
 * Core fixture layer - infrastructure shared by every API test.
 *
 * The API suite gates on `API_ENV`, not on `TEST_ENV`: the feature
 * matrix describes the backend the API clients talk to, which is exactly
 * what `API_ENV` selects.
 */

/** A snapshot of the environment this run resolved to. */
export interface ApiAppConfig {
  /** The suite environment - drives browser navigation. */
  testEnv: TestEnv;
  /** The server/API environment - drives the API clients. */
  apiEnv: TestEnv;
  /** Base URL the browser navigates to. */
  baseURL: string;
  /** Base URL the API clients call. */
  apiBaseURL: string;
  /** True when the two env axes point at different backends. */
  axesDiffer: boolean;
  /** The transport the API suite speaks. */
  transport: StrategyId;
}

export interface ApiCoreFixtures {
  appConfig: ApiAppConfig;
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
        featureGateSkipReason(testInfo.tags, API_ENV) ??
        mutatingTestSkipReason(testInfo.tags, API_ENV);
      if (reason) {
        testInfo.skip(true, reason);
      }
      await use(undefined);
    },
    { auto: true, title: 'tag-gate' },
  ],

  appConfig: async ({}, use: (value: ApiAppConfig) => Promise<void>) => {
    await use({
      testEnv: TEST_ENV,
      apiEnv: API_ENV,
      baseURL,
      apiBaseURL,
      axesDiffer: envAxesDiffer(),
      transport: strategyFactory.resolveId(),
    });
  },
} satisfies Parameters<typeof base.extend<ApiCoreFixtures>>[0];
