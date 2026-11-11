/**
 * tests-db/transaction.spec.ts
 *
 * The TRANSACTION table (PB-3003).
 *
 * Every transaction in ParaBank's history is booked in pairs. A transfer
 * writes one row on the account the money leaves and one on the account
 * it arrives in:
 *
 *   - `DEBIT`  "Funds Transfer Sent"     on the source account,
 *   - `CREDIT` "Funds Transfer Received" on the destination account.
 *
 * Opening another account is booked the same way: the minimum deposit
 * leaves the paying account and arrives in the new one.
 *
 * The opening deposit of a freshly registered customer is NOT booked as
 * a transaction - the account is simply created with a balance - which
 * is why a new customer starts with an empty history.
 *
 * `TRANSACTION.TYPE` stores an ordinal: 0 = Credit, 1 = Debit.
 */
import {
  test,
  expect,
  Tags,
  featureTag,
  ticketTitle,
  Tickets,
  DbTransactionType,
} from '../src/db/fixtures';
import type { DbTransaction } from '../src/db/fixtures';

/** The description ParaBank books the outgoing half of a transfer with. */
const TRANSFER_SENT = 'Funds Transfer Sent';

/** The description ParaBank books the incoming half of a transfer with. */
const TRANSFER_RECEIVED = 'Funds Transfer Received';

/** The rows of the given amount, oldest first. */
function rowsOfAmount(rows: DbTransaction[], amount: number): DbTransaction[] {
  return rows.filter((row) => Math.abs(row.amount - amount) < 0.005);
}

/** The newest row of the given amount, or `undefined`. */
function newestRowOfAmount(
  rows: DbTransaction[],
  amount: number,
): DbTransaction | undefined {
  const matching = rowsOfAmount(rows, amount);
  return matching[matching.length - 1];
}

test.describe('ParaBank database - transaction', () => {
  test(
    ticketTitle(Tickets.dbTransaction, 'leaves a newly registered customer without transactions'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('db-transaction')] },
    async ({ registeredCustomer, transactionRepository }) => {
      const transactions = await transactionRepository.findByCustomer(
        registeredCustomer.customer.id,
      );

      expect(transactions).toEqual([]);
    },
  );

  test(
    ticketTitle(Tickets.dbTransaction, 'books the outgoing half of a transfer on the source account'),
    { tag: [Tags.REGRESSION, featureTag('db-transaction')] },
    async ({ appDriver, savingsAccount, transactionRepository }) => {
      const response = await appDriver.transfer(
        savingsAccount.source.id,
        savingsAccount.savings.id,
        '50',
      );
      expect(response.status).toBe(200);

      const transactions = await transactionRepository.findByAccount(savingsAccount.source.id);
      const transfer = newestRowOfAmount(transactions, 50);

      expect(transfer?.type).toBe(DbTransactionType.DEBIT);
      expect(transfer?.description).toBe(TRANSFER_SENT);
      expect(transfer?.accountId).toBe(savingsAccount.source.id);
    },
  );

  test(
    ticketTitle(Tickets.dbTransaction, 'books the incoming half of a transfer on the destination account'),
    { tag: [Tags.REGRESSION, featureTag('db-transaction')] },
    async ({ appDriver, savingsAccount, transactionRepository }) => {
      const response = await appDriver.transfer(
        savingsAccount.source.id,
        savingsAccount.savings.id,
        '50',
      );
      expect(response.status).toBe(200);

      const transactions = await transactionRepository.findByAccount(savingsAccount.savings.id);
      const transfer = newestRowOfAmount(transactions, 50);

      expect(transfer?.type).toBe(DbTransactionType.CREDIT);
      expect(transfer?.description).toBe(TRANSFER_RECEIVED);
      expect(transfer?.accountId).toBe(savingsAccount.savings.id);
    },
  );

  test(
    ticketTitle(Tickets.dbTransaction, 'writes one transaction on each side of a transfer'),
    { tag: [Tags.REGRESSION, featureTag('db-transaction')] },
    async ({ appDriver, savingsAccount, transactionRepository }) => {
      const sourceBefore = await transactionRepository.countByAccount(savingsAccount.source.id);
      const destinationBefore = await transactionRepository.countByAccount(
        savingsAccount.savings.id,
      );

      await appDriver.transfer(savingsAccount.source.id, savingsAccount.savings.id, '50');

      expect(await transactionRepository.countByAccount(savingsAccount.source.id)).toBe(
        sourceBefore + 1,
      );
      expect(await transactionRepository.countByAccount(savingsAccount.savings.id)).toBe(
        destinationBefore + 1,
      );
    },
  );

  test(
    ticketTitle(Tickets.dbTransaction, 'takes the transferred amount out of the source balance'),
    { tag: [Tags.REGRESSION, featureTag('db-transaction')] },
    async ({ appDriver, savingsAccount, accountRepository }) => {
      const before = await accountRepository.balanceOf(savingsAccount.source.id);

      await appDriver.transfer(savingsAccount.source.id, savingsAccount.savings.id, '50');

      const after = await accountRepository.balanceOf(savingsAccount.source.id);
      expect(after).toBeCloseTo((before ?? 0) - 50, 2);
    },
  );

  test(
    ticketTitle(Tickets.dbTransaction, 'adds the transferred amount to the destination balance'),
    { tag: [Tags.REGRESSION, featureTag('db-transaction')] },
    async ({ appDriver, savingsAccount, accountRepository }) => {
      const before = await accountRepository.balanceOf(savingsAccount.savings.id);

      await appDriver.transfer(savingsAccount.source.id, savingsAccount.savings.id, '50');

      const after = await accountRepository.balanceOf(savingsAccount.savings.id);
      expect(after).toBeCloseTo((before ?? 0) + 50, 2);
    },
  );

  test(
    ticketTitle(Tickets.dbTransaction, 'books the account opening deposit as a pair of transactions'),
    { tag: [Tags.REGRESSION, featureTag('db-transaction')] },
    async ({ savingsAccount, transactionRepository }) => {
      const sourceRows = await transactionRepository.findByAccount(savingsAccount.source.id);
      const destinationRows = await transactionRepository.findByAccount(
        savingsAccount.savings.id,
      );

      const sent = newestRowOfAmount(sourceRows, 100);
      const received = newestRowOfAmount(destinationRows, 100);

      expect(sent?.type).toBe(DbTransactionType.DEBIT);
      expect(sent?.description).toBe(TRANSFER_SENT);
      expect(received?.type).toBe(DbTransactionType.CREDIT);
      expect(received?.description).toBe(TRANSFER_RECEIVED);
    },
  );

  test(
    ticketTitle(Tickets.dbTransaction, 'books the same transfer on both accounts of the customer'),
    { tag: [Tags.REGRESSION, featureTag('db-transaction')] },
    async ({ appDriver, savingsAccount, transactionRepository }) => {
      await appDriver.transfer(savingsAccount.source.id, savingsAccount.savings.id, '25');

      const customerRows = await transactionRepository.findByCustomer(
        savingsAccount.source.customerId,
      );
      const transfers = rowsOfAmount(customerRows, 25);

      expect(transfers).toHaveLength(2);
      expect(transfers.map((row) => row.type).sort()).toEqual([
        DbTransactionType.CREDIT,
        DbTransactionType.DEBIT,
      ]);
    },
  );

  test(
    ticketTitle(Tickets.dbTransaction, 'allows a transfer that exceeds the balance of the source account'),
    { tag: [Tags.BOUNDARY, featureTag('db-transaction')] },
    async ({ appDriver, savingsAccount, accountRepository, transactionRepository }) => {
      const before = await accountRepository.balanceOf(savingsAccount.source.id);

      const response = await appDriver.transfer(
        savingsAccount.source.id,
        savingsAccount.savings.id,
        '999999',
      );

      expect(response.status).toBe(200);
      const after = await accountRepository.balanceOf(savingsAccount.source.id);
      expect(after).toBeCloseTo((before ?? 0) - 999999, 2);
      expect(after).toBeLessThan(0);

      const transactions = await transactionRepository.findByAccount(savingsAccount.source.id);
      expect(newestRowOfAmount(transactions, 999999)?.type).toBe(DbTransactionType.DEBIT);
    },
  );
});
