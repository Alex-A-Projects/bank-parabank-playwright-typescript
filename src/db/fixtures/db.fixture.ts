import { test as base } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { dbAppBaseURL } from '../../shared/env';
import { DbClient } from '../client/db-client';
import { AccountRepository } from '../repositories/account.repository';
import { CustomerRepository } from '../repositories/customer.repository';
import { LoanRepository } from '../repositories/loan.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { ParaBankAppDriver } from '../drivers/app.driver';
import type { DbCoreFixtures } from './core.fixture';

/**
 * Database fixture layer.
 *
 * Provides the JDBC client, the repositories built on it, and the
 * application driver the suite writes through.
 *
 * The client is created once per test, so the repositories share a
 * single compiled helper within a test but never leak state into the
 * next one.
 */
export interface DbClientFixtures {
  /** The JDBC bridge. */
  dbClient: DbClient;
  /** Reads the `CUSTOMER` table. */
  customerRepository: CustomerRepository;
  /** Reads the `ACCOUNT` table. */
  accountRepository: AccountRepository;
  /** Reads the `TRANSACTION` table. */
  transactionRepository: TransactionRepository;
  /** Reads the loan side of the `ACCOUNT` table. */
  loanRepository: LoanRepository;
  /** Writes through the running application. */
  appDriver: ParaBankAppDriver;
}

export const dbClientFixtures = {
  dbClient: async ({}, use: (value: DbClient) => Promise<void>) => {
    await use(new DbClient());
  },

  customerRepository: async ({ dbClient }, use: (value: CustomerRepository) => Promise<void>) => {
    await use(new CustomerRepository(dbClient));
  },

  accountRepository: async ({ dbClient }, use: (value: AccountRepository) => Promise<void>) => {
    await use(new AccountRepository(dbClient));
  },

  transactionRepository: async (
    { dbClient },
    use: (value: TransactionRepository) => Promise<void>,
  ) => {
    await use(new TransactionRepository(dbClient));
  },

  loanRepository: async ({ dbClient }, use: (value: LoanRepository) => Promise<void>) => {
    await use(new LoanRepository(dbClient));
  },

  appDriver: async (
    { request }: { request: APIRequestContext },
    use: (value: ParaBankAppDriver) => Promise<void>,
  ) => {
    await use(new ParaBankAppDriver(request, dbAppBaseURL));
  },
} satisfies Parameters<typeof base.extend<DbCoreFixtures & DbClientFixtures>>[0];
