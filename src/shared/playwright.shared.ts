import type { ReporterDescription } from '@playwright/test';

/**
 * The bits of Playwright configuration every suite shares.
 *
 * Each suite still owns its own config file - that is the point of the
 * layout - but the policy (how many retries, where the reports go, what
 * the browser is allowed to do) is decided once, here, so the three
 * suites cannot drift apart.
 */

/** The suites the repository contains. */
export type SuiteName = 'ui' | 'api' | 'db';

/** Where each suite writes its Allure results. */
export const ALLURE_RESULTS_DIRS: Record<SuiteName, string> = {
  ui: 'allure-results/ui',
  api: 'allure-results/api',
  db: 'allure-results/db',
};

/** Where each suite writes its HTML report. */
export const HTML_REPORT_DIRS: Record<SuiteName, string> = {
  ui: 'playwright-report/ui',
  api: 'playwright-report/api',
  db: 'playwright-report/db',
};

/**
 * The reporter list for a suite.
 *
 * Three reporters, all writing to their own directory:
 *   - `list` for the terminal,
 *   - the built-in HTML report, per suite,
 *   - Allure results, per suite - `allure serve allure-results` reads
 *     the whole tree, and the CI job publishes it as one report.
 */
export function reporters(suite: SuiteName): ReporterDescription[] {
  return [
    ['list'],
    ['html', { open: 'never', outputFolder: HTML_REPORT_DIRS[suite] }],
    ['allure-playwright', { resultsDir: ALLURE_RESULTS_DIRS[suite] }],
  ];
}

/** The `use` options every suite shares. */
export const commonUse = {
  trace: 'on-first-retry' as const,
  screenshot: 'only-on-failure' as const,
  video: 'retain-on-failure' as const,
  actionTimeout: 10_000,
  navigationTimeout: 30_000,
};

/** How often a failed test is retried. CI retries; a local run does not. */
export const retries = process.env.CI ? 2 : 0;

/**
 * `forbidOnly` is on in CI.
 *
 * A committed `test.only` would silently reduce the suite to one test
 * in every CI run while looking green locally.
 */
export const forbidOnly = !!process.env.CI;
