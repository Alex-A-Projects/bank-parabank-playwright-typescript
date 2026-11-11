/**
 * tests-db/integration.spec.ts
 *
 * The application and its database agree (PB-3004).
 *
 * Every other database spec looks at one table. This one looks at the
 * two halves of ParaBank at the same time: what the service layer
 * reports and what the database actually holds. A row that is written
 * but not reported (or reported but not written) is a defect no
 * single-table check would catch.
 *
 * The application side is read through the same REST endpoints the
 * application's own pages use, so this is a genuine second opinion
 * rather than a replay of the same query.
 *
 * The date of a transaction is not compared: the database stores a plain
 * date, the service reports a timestamp, and the two are rendered
 * differently on purpose.
 */
import {
  test,
  expect,
  Tags,
  featureTag,
  ticketTitle,
  Tickets,
  accountTypeName,
  AccountTypeNames,
  transactionTypeName,
} from '../src/db/fixtures';

/** An account as the service layer reports it. */
interface ReportedAccount {
  id: number;
  customerId: number;
  type: string;
  balance: number;
}

/** A transaction as the service layer reports it. */
interface ReportedTransaction {
  id: number;
  accountId: number;
  type: string;
  date: number;
  amount: number;
  description: string;
}

test.describe('ParaBank database - application and database', () => {
  test(
    ticketTitle(Tickets.dbIntegration, 'reports exactly the accounts the database holds'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('db-integration')] },
    async ({ registeredCustomer, appDriver, accountRepository }) => {
      const response = await appDriver.accountsOf(registeredCustomer.customer.id);
      expect(response.status).toBe(200);
      const reported = JSON.parse(response.body) as ReportedAccount[];

      const stored = await accountRepository.findByCustomer(registeredCustomer.customer.id);

      expect(reported).toHaveLength(stored.length);
      expect(reported.map((account) => account.id).sort()).toEqual(
        stored.map((account) => account.id).sort(),
      );
    },
  );

  test(
    ticketTitle(Tickets.dbIntegration, 'reports the same type for every account'),
    { tag: [Tags.REGRESSION, featureTag('db-integration')] },
    async ({ registeredCustomer, savingsAccount, appDriver, accountRepository }) => {
      const response = await appDriver.accountsOf(registeredCustomer.customer.id);
      const reported = JSON.parse(response.body) as ReportedAccount[];

      const stored = await accountRepository.findByCustomer(registeredCustomer.customer.id);

      for (const account of stored) {
        const match = reported.find((candidate) => candidate.id === account.id);
        expect(match, `account ${account.id} is missing from the service response`).toBeDefined();
        expect(match?.type).toBe(accountTypeName(account.type));
      }
      expect(
        reported.find((account) => account.id === savingsAccount.savings.id)?.type,
      ).toBe(AccountTypeNames.SAVINGS);
    },
  );

  test(
    ticketTitle(Tickets.dbIntegration, 'reports the same balance for every account'),
    { tag: [Tags.REGRESSION, featureTag('db-integration')] },
    async ({ registeredCustomer, appDriver, accountRepository }) => {
      const response = await appDriver.accountsOf(registeredCustomer.customer.id);
      const reported = JSON.parse(response.body) as ReportedAccount[];

      const stored = await accountRepository.findByCustomer(registeredCustomer.customer.id);

      for (const account of stored) {
        const match = reported.find((candidate) => candidate.id === account.id);
        expect(match, `account ${account.id} is missing from the service response`).toBeDefined();
        expect(match?.balance).toBeCloseTo(account.balance, 2);
      }
    },
  );

  test(
    ticketTitle(Tickets.dbIntegration, 'reports exactly the transactions the database holds'),
    { tag: [Tags.REGRESSION, featureTag('db-integration')] },
    async ({ registeredCustomer, savingsAccount, appDriver, transactionRepository }) => {
      const response = await appDriver.transactionsOf(savingsAccount.source.id);
      expect(response.status).toBe(200);
      const reported = JSON.parse(response.body) as ReportedTransaction[];

      const stored = await transactionRepository.findByAccount(savingsAccount.source.id);

      expect(reported).toHaveLength(stored.length);
      expect(reported.map((transaction) => transaction.id).sort()).toEqual(
        stored.map((transaction) => transaction.id).sort(),
      );
    },
  );

  test(
    ticketTitle(Tickets.dbIntegration, 'reports the same amount, type and description for every transaction'),
    { tag: [Tags.REGRESSION, featureTag('db-integration')] },
    async ({ registeredCustomer, appDriver, savingsAccount, transactionRepository }) => {
      await appDriver.transfer(savingsAccount.source.id, savingsAccount.savings.id, '75');

      const response = await appDriver.transactionsOf(savingsAccount.source.id);
      const reported = JSON.parse(response.body) as ReportedTransaction[];
      const stored = await transactionRepository.findByAccount(savingsAccount.source.id);

      for (const transaction of stored) {
        const match = reported.find((candidate) => candidate.id === transaction.id);
        expect(
          match,
          `transaction ${transaction.id} is missing from the service response`,
        ).toBeDefined();
        expect(match?.amount).toBeCloseTo(transaction.amount, 2);
        expect(match?.description).toBe(transaction.description);
        expect(match?.type).toBe(transactionTypeName(transaction.type));
      }
    },
  );

  test(
    ticketTitle(Tickets.dbIntegration, 'leaves the customer row untouched while the accounts change'),
    { tag: [Tags.REGRESSION, featureTag('db-integration')] },
    async ({ registeredCustomer, savingsAccount, customerRepository }) => {
      // The savings account was opened through the application before
      // this test body ran. Opening an account must not touch the
      // customer row.
      const after = await customerRepository.findByUsername(registeredCustomer.username);

      expect(after).not.toBeNull();
      expect(after).toEqual(registeredCustomer.customer);
    },
  );
});
