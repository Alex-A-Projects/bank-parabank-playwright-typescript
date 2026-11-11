import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';
import { HomePage } from '../pages/HomePage';
import { AccountService } from '../services/account.service';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { CustomerService } from '../services/customer.service';
import { TransactionService } from '../services/transaction.service';
import { customerFactory } from '../../shared/factories';
import type { CustomerPayload } from '../../shared/factories';
import { demoCustomer } from '../../shared/env';

/**
 * Flow fixture layer - multi-step business flows and the services that
 * own them.
 *
 * `authenticatedPage` signs in with the seeded demo customer;
 * `registeredCustomer` registers a brand-new, uniquely-named customer so
 * that a test can mutate the demo dataset without disturbing any other
 * test. Tests must use one or the other - never both - because they
 * represent different sessions.
 */
export interface FlowFixtures {
  authService: AuthService;
  accountService: AccountService;
  customerService: CustomerService;
  transactionService: TransactionService;
  adminService: AdminService;
  authenticatedPage: Page;
  overviewPage: AccountOverviewPage;
  registeredCustomer: CustomerPayload;
}

export const flowFixtures = {
  authService: async ({ page }, use: (value: AuthService) => Promise<void>) => {
    await use(new AuthService(page));
  },

  accountService: async ({ page }, use: (value: AccountService) => Promise<void>) => {
    await use(new AccountService(page));
  },

  customerService: async ({ page }, use: (value: CustomerService) => Promise<void>) => {
    await use(new CustomerService(page));
  },

  transactionService: async ({ page }, use: (value: TransactionService) => Promise<void>) => {
    await use(new TransactionService(page));
  },

  adminService: async ({ page }, use: (value: AdminService) => Promise<void>) => {
    await use(new AdminService(page));
  },

  /** Sign in with the seeded demo customer and hand back the live page. */
  authenticatedPage: async (
    { page },
    use: (value: Page) => Promise<void>,
  ): Promise<void> => {
    const home = new HomePage(page);
    await home.open();
    await home.login(demoCustomer.username, demoCustomer.password);
    await use(page);
  },

  /** The accounts overview of the signed-in demo customer. */
  overviewPage: async (
    { authenticatedPage },
    use: (value: AccountOverviewPage) => Promise<void>,
  ): Promise<void> => {
    await use(new AccountOverviewPage(authenticatedPage));
  },

  /**
   * Register a brand-new customer with a unique username.
   *
   * Any existing session is ended first, so the fixture never leaves the
   * browser signed in as somebody else.
   */
  registeredCustomer: async (
    { page, authService, customerService },
    use: (value: CustomerPayload) => Promise<void>,
  ): Promise<void> => {
    if (await authService.isAuthenticated()) {
      await authService.logout();
    }
    const customer = customerFactory.build();
    await customerService.register(customer);
    await use(customer);
  },
} satisfies Parameters<typeof base.extend<FlowFixtures>>[0];
