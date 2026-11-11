import { test as base } from '@playwright/test';
import { demoCustomer } from '../../shared/env';
import type { ApiClientFixtures } from './api.fixture';
import type { ApiCoreFixtures } from './core.fixture';
import type { Customer } from '../models/customer.model';

/**
 * API flow fixture layer.
 *
 * A flow is a small, reusable scenario: log in, and everything that
 * needs a logged-in customer. Flows are independent of each other and
 * of the test that requests them.
 */
export interface ApiFlowFixtures {
  /**
   * The seeded demo customer, logged in.
   *
   * ParaBank does not create a customer on the fly, so the seeded
   * account is the only customer a purely API-side test can use.
   */
  demoSession: Customer;
}

export const flowFixtures = {
  demoSession: async (
    { paraBank },
    use: (value: Customer) => Promise<void>,
  ) => {
    const result = await paraBank.auth.login(demoCustomer.username, demoCustomer.password);
    if (result.data === null) {
      const reason = result.fault ?? `HTTP ${result.status}`;
      throw new Error(
        `Could not log in as the demo customer "${demoCustomer.username}": ${reason}. ` +
          'Check DEMO_USERNAME / DEMO_PASSWORD in the environment.',
      );
    }
    await use(result.data);
  },
} satisfies Parameters<
  typeof base.extend<ApiCoreFixtures & ApiClientFixtures & ApiFlowFixtures>
>[0];
