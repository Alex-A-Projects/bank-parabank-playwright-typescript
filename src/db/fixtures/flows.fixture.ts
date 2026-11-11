import { test as base } from '@playwright/test';
import { AccountTypeCode } from '../../shared/account-types';
import { customerFactory } from '../../shared/factories';
import type { CustomerPayload } from '../../shared/factories';
import { DbAccountType } from '../models/account.model';
import type { DbAccount } from '../models/account.model';
import type { DbCustomer } from '../models/customer.model';
import type { DbClientFixtures } from './db.fixture';
import type { DbCoreFixtures } from './core.fixture';

/**
 * Database flow fixture layer.
 *
 * A flow is a small, reusable scenario. The database suite has exactly
 * one write path: create a customer through the running application,
 * then read the result back out of the database.
 *
 * Every flow registers a customer with a unique username, so tests stay
 * independent of each other and of the order they run in - the
 * isolation strategy for the database suite.
 */
export interface DbFlowFixtures {
  /**
   * A customer that was just registered through the application, with
   * the database rows it produced.
   */
  registeredCustomer: RegisteredCustomer;

  /**
   * A registered customer that has opened a savings account through the
   * application, with both accounts as the database now holds them.
   */
  savingsAccount: SavingsAccount;
}

/**
 * A savings account that was opened through the application.
 *
 * Opening an account is a write that costs the source account the
 * minimum deposit, so the fixture reports the balance the source
 * account had before as well as the accounts as they are afterwards.
 */
export interface SavingsAccount {
  /** The checking account the deposit was taken from, as it is now. */
  source: DbAccount;
  /** The savings account that was opened. */
  savings: DbAccount;
  /** The balance of the source account before the account was opened. */
  sourceBalanceBefore: number;
}

/** A customer registered through the application, plus its database rows. */
export interface RegisteredCustomer {
  /** The `CUSTOMER` row the application wrote. */
  customer: DbCustomer;
  /** The `ACCOUNT` rows the customer owns. */
  accounts: DbAccount[];
  /** The username the customer was registered with. */
  username: string;
  /** The password the customer was registered with. */
  password: string;
  /** The payload that was submitted to the registration form. */
  payload: CustomerPayload;
}

export const flowFixtures = {
  registeredCustomer: async (
    { appDriver, customerRepository, accountRepository },
    use: (value: RegisteredCustomer) => Promise<void>,
  ) => {
    const payload = customerFactory.build();

    const response = await appDriver.register(payload);
    if (!response.body.includes('Customer Created')) {
      throw new Error(
        `Registration of "${payload.username}" did not succeed: ` +
          `HTTP ${response.status} without the "Customer Created" marker.`,
      );
    }

    const customer = await customerRepository.findByUsername(payload.username);
    if (!customer) {
      throw new Error(
        `The customer "${payload.username}" was registered but no CUSTOMER row ` +
          'was found. The application and the database under test may not be ' +
          'the same instance - check DB_JDBC_URL and LOCAL_BASE_URL.',
      );
    }

    const accounts = await accountRepository.findByCustomer(customer.id);

    await use({
      customer,
      accounts,
      username: payload.username,
      password: payload.password,
      payload,
    });
  },

  savingsAccount: async (
    { appDriver, accountRepository, registeredCustomer },
    use: (value: SavingsAccount) => Promise<void>,
  ) => {
    const source = registeredCustomer.accounts.find(
      (account) => account.type === DbAccountType.CHECKING,
    );
    if (!source) {
      throw new Error(
        `Customer "${registeredCustomer.username}" has no checking account to ` +
          'open the savings account from.',
      );
    }

    const sourceBalanceBefore = source.balance;

    const response = await appDriver.openAccount(
      registeredCustomer.customer.id,
      AccountTypeCode.SAVINGS,
      source.id,
    );
    if (response.status !== 200) {
      throw new Error(
        `Opening a savings account for "${registeredCustomer.username}" failed: ` +
          `HTTP ${response.status} ${response.body}`,
      );
    }

    const accounts = await accountRepository.findByCustomer(registeredCustomer.customer.id);
    const savings = accounts.find((account) => account.type === DbAccountType.SAVINGS);
    const refreshedSource = accounts.find((account) => account.id === source.id);

    if (!savings || !refreshedSource) {
      throw new Error(
        `Opening a savings account for "${registeredCustomer.username}" did not ` +
          'produce the expected ACCOUNT rows.',
      );
    }

    await use({ source: refreshedSource, savings, sourceBalanceBefore });
  },
} satisfies Parameters<
  typeof base.extend<DbCoreFixtures & DbClientFixtures & DbFlowFixtures>
>[0];
