import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Rate-limit aware navigation.
 *
 * The public ParaBank demo sits behind Cloudflare, which answers with a
 * rate-limit page ("Error 1015 - You are being rate limited") when the
 * suite calls it too often. The navigation helper retries in that case.
 *
 * The wait between the attempts is a **poll on the condition** - "the
 * page is no longer the rate-limit page" - with a widening interval.
 * There is no fixed sleep anywhere in this module: a run against the
 * cloud demo spends no time it does not need, and a run that is not
 * rate limited is not slowed down at all.
 *
 * This module lives in the shared layer because it is framework glue
 * rather than product behaviour, and because the shared layer is where
 * the suite keeps the things that are not a POM, a client, a service or
 * a repository - the layers where an assertion would be a mistake.
 */

/**
 * True when the page currently shows Cloudflare's rate-limit page.
 *
 * A page that has never loaded anything is not a rate-limit page, and a
 * locator that cannot be resolved is not either.
 */
export async function isRateLimited(page: Page): Promise<boolean> {
  return await page
    .locator('text=/Error 1015|being rate limited/i')
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);
}

/** How long a single navigation attempt may take. */
const DEFAULT_NAVIGATION_TIMEOUT_MS = 25_000;

/** How long the whole retry may take before it gives up. */
const DEFAULT_TOTAL_TIMEOUT_MS = 70_000;

/**
 * The intervals between the retries: 10 s, then 20 s, then 40 s.
 *
 * They sum to 70 s, which keeps the worst case inside the suite's
 * 120 s test timeout - a longer budget would let the navigation succeed
 * after the test has already been abandoned.
 */
const RETRY_INTERVALS_MS = [10_000, 20_000, 40_000];

/**
 * Navigates to `url`, retrying while the instance answers with the
 * rate-limit page.
 *
 * A navigation that fails for any other reason is not a rate limit; the
 * content of the page decides, and a page that is not the rate-limit
 * page ends the retry.
 *
 * @throws when the instance keeps answering with the rate-limit page.
 */
export async function gotoWithRateLimitRetry(
  page: Page,
  url: string,
  options: { navigationTimeoutMs?: number; totalTimeoutMs?: number } = {},
): Promise<void> {
  const navigationTimeoutMs = options.navigationTimeoutMs ?? DEFAULT_NAVIGATION_TIMEOUT_MS;
  const totalTimeoutMs = options.totalTimeoutMs ?? DEFAULT_TOTAL_TIMEOUT_MS;

  await expect
    .poll(
      async () => {
        try {
          await page.goto(url, { waitUntil: 'load', timeout: navigationTimeoutMs });
        } catch {
          // The navigation failed rather than being rate limited. The
          // page still holds its previous content, so the check below
          // decides whether this attempt counts as a success.
        }
        return !(await isRateLimited(page));
      },
      {
        timeout: totalTimeoutMs,
        intervals: RETRY_INTERVALS_MS,
        message:
          `The instance at ${url} kept answering with the rate-limit page. ` +
          'The public demo limits how often it can be called.',
      },
    )
    .toBe(true);
}
