import { expect, request } from '@playwright/test';
import { dbAppBaseURL, TEST_ENV } from '../shared/env';
import { isFeatureEnabled } from '../shared/policy';
import { DbClient } from './client/db-client';

/**
 * The features this suite owns. If every one of them is disabled for
 * the current environment, the whole suite is skipped and the setup
 * must not insist on a database it is never going to use.
 */
const DB_FEATURES = ['db-customer', 'db-account', 'db-transaction', 'db-integration'];

/**
 * Database suite global setup.
 *
 * Two things have to be true before the first database test runs:
 *
 *   1. the ParaBank instance that owns the database is up;
 *   2. the database has a schema.
 *
 * ParaBank creates and seeds its schema LAZILY - on the first request it
 * serves - so a freshly started container has an empty database for a
 * moment. A test that queried it in that window would fail for an
 * infrastructure reason, so the setup waits for the database to answer
 * before any test starts.
 *
 * The wait is a poll on a condition, not a fixed sleep: it finishes as
 * soon as the database is ready and gives up with a clear message when
 * it never becomes ready.
 *
 * When every `db-*` feature is disabled for the current environment -
 * the public cloud demo, which does not expose its HSQLDB port - the
 * setup returns immediately. Without that, running the unified config
 * against the cloud would fail on infrastructure the suite is not going
 * to use.
 */
export default async function globalSetup(): Promise<void> {
  const suiteRuns = DB_FEATURES.some((feature) => isFeatureEnabled(feature, TEST_ENV));
  if (!suiteRuns) {
    console.log(
      `[db] every ${DB_FEATURES.join(', ')} feature is disabled in "${TEST_ENV}" - ` +
        'the database suite has nothing to set up.',
    );
    return;
  }

  const context = await request.newContext();
  try {
    const response = await context.get(`${dbAppBaseURL}/index.htm`, { timeout: 30_000 });
    if (response.status() >= 500) {
      throw new Error(
        `The ParaBank instance at ${dbAppBaseURL} answered HTTP ${response.status()}. ` +
          'Is the container running? `npm run db:up` starts it.',
      );
    }
  } finally {
    await context.dispose();
  }

  const db = new DbClient();
  await expect
    .poll(
      async () => {
        try {
          await db.exec('customer-count');
          return true;
        } catch {
          return false;
        }
      },
      {
        timeout: 60_000,
        intervals: [500, 1000, 2000, 5000],
        message:
          `The ParaBank database at the configured JDBC URL did not become ready. ` +
          'The application initialises its schema on the first request it serves.',
      },
    )
    .toBe(true);
}
