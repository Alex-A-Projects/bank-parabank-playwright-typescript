/**
 * tests-db/account.spec.ts
 *
 * The ACCOUNT table (PB-3002).
 *
 * Accounts are never written directly. They come into existence the way
 * a customer creates them: through the application's own "open account"
 * operation. The suite then reads the rows over JDBC.
 *
 * Two facts about ParaBank drive the expectations here, and both were
 * read off the running database rather than assumed:
 *
 *   - a freshly registered customer owns exactly one CHECKING account,
 *     funded with the opening deposit of 515.50;
 *   - opening any further account moves the minimum deposit of 100.00
 *     out of the account the customer pays from and into the new one.
 *
 * `ACCOUNT.TYPE` stores an ordinal - 0 = CHECKING, 1 = SAVINGS,
 * 2 = LOAN.
 */
import {
  test,
  expect,
  Tags,
  featureTag,
  ticketTitle,
  Tickets,
  DbAccountType,
  customerFactory,
} from '../src/db/fixtures';

/** The deposit ParaBank puts into the account of a new customer. */
const OPENING_DEPOSIT = 515.5;

/** The minimum deposit that moves when another account is opened. */
const MINIMUM_DEPOSIT = 100;

test.describe('ParaBank database - account', () => {
  test(
    ticketTitle(Tickets.dbAccount, 'gives a newly registered customer exactly one account'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('db-account')] },
    async ({ registeredCustomer, accountRepository }) => {
      const accounts = await accountRepository.findByCustomer(registeredCustomer.customer.id);

      expect(accounts).toHaveLength(1);
      expect(accounts[0]?.customerId).toBe(registeredCustomer.customer.id);
    },
  );

  test(
    ticketTitle(Tickets.dbAccount, 'opens the first account as a checking account'),
    { tag: [Tags.REGRESSION, featureTag('db-account')] },
    async ({ registeredCustomer, accountRepository }) => {
      const accounts = await accountRepository.findByCustomer(registeredCustomer.customer.id);

      expect(accounts[0]?.type).toBe(DbAccountType.CHECKING);
    },
  );

  test(
    ticketTitle(Tickets.dbAccount, 'funds the first account with the opening deposit'),
    { tag: [Tags.REGRESSION, featureTag('db-account')] },
    async ({ registeredCustomer, accountRepository }) => {
      const accounts = await accountRepository.findByCustomer(registeredCustomer.customer.id);

      expect(accounts[0]?.balance).toBeCloseTo(OPENING_DEPOSIT, 2);
    },
  );

  test(
    ticketTitle(Tickets.dbAccount, 'adds a row for the account the customer opens'),
    { tag: [Tags.REGRESSION, featureTag('db-account')] },
    async ({ registeredCustomer, savingsAccount, accountRepository }) => {
      const accounts = await accountRepository.findByCustomer(registeredCustomer.customer.id);

      expect(accounts).toHaveLength(2);
      expect(accounts.map((account) => account.id)).toContain(savingsAccount.savings.id);
    },
  );

  test(
    ticketTitle(Tickets.dbAccount, 'records the type of the account the customer opens'),
    { tag: [Tags.REGRESSION, featureTag('db-account')] },
    async ({ savingsAccount }) => {
      expect(savingsAccount.savings.type).toBe(DbAccountType.SAVINGS);
    },
  );

  test(
    ticketTitle(Tickets.dbAccount, 'links the opened account to the customer that opened it'),
    { tag: [Tags.REGRESSION, featureTag('db-account')] },
    async ({ registeredCustomer, savingsAccount }) => {
      expect(savingsAccount.savings.customerId).toBe(registeredCustomer.customer.id);
    },
  );

  test(
    ticketTitle(Tickets.dbAccount, 'takes the minimum deposit out of the paying account'),
    { tag: [Tags.REGRESSION, featureTag('db-account')] },
    async ({ savingsAccount }) => {
      expect(savingsAccount.source.balance).toBeCloseTo(
        savingsAccount.sourceBalanceBefore - MINIMUM_DEPOSIT,
        2,
      );
    },
  );

  test(
    ticketTitle(Tickets.dbAccount, 'credits the minimum deposit to the opened account'),
    { tag: [Tags.REGRESSION, featureTag('db-account')] },
    async ({ savingsAccount }) => {
      expect(savingsAccount.savings.balance).toBeCloseTo(MINIMUM_DEPOSIT, 2);
    },
  );

  test(
    ticketTitle(Tickets.dbAccount, 'keeps the accounts of two customers apart'),
    { tag: [Tags.REGRESSION, featureTag('db-account')] },
    async ({ appDriver, customerRepository, accountRepository }) => {
      const first = customerFactory.build();
      const second = customerFactory.build();

      await appDriver.register(first);
      await appDriver.register(second);

      const firstCustomer = await customerRepository.findByUsername(first.username);
      const secondCustomer = await customerRepository.findByUsername(second.username);

      const firstAccounts = await accountRepository.findByCustomer(firstCustomer?.id ?? 0);
      const secondAccounts = await accountRepository.findByCustomer(secondCustomer?.id ?? 0);

      expect(firstAccounts).toHaveLength(1);
      expect(secondAccounts).toHaveLength(1);
      expect(firstAccounts[0]?.id).not.toBe(secondAccounts[0]?.id);
    },
  );
});
