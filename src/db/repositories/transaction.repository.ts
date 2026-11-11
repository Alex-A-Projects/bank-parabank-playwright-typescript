import type { DbClient } from '../client/db-client';
import { dbRowFactory } from '../factories/row.factory';
import type { DbTransaction } from '../models/transaction.model';

/**
 * TransactionRepository - reads ParaBank's `TRANSACTION` table.
 *
 * ZERO ASSERTIONS.
 */
export class TransactionRepository {
  constructor(private readonly db: DbClient) {}

  /** The transaction with this id, or `null`. */
  async findById(transactionId: number): Promise<DbTransaction | null> {
    const output = await this.db.exec('transaction-by-id', [String(transactionId)]);
    const row = dbRowFactory.rows(output)[0];
    return row ? dbRowFactory.transaction(row) : null;
  }

  /** Every transaction on an account, ordered by id. */
  async findByAccount(accountId: number): Promise<DbTransaction[]> {
    const output = await this.db.exec('transactions-by-account', [String(accountId)]);
    return dbRowFactory
      .rows(output)
      .map((row) => dbRowFactory.transaction(row))
      .filter((transaction): transaction is DbTransaction => transaction !== null);
  }

  /** Every transaction on every account a customer owns, ordered by id. */
  async findByCustomer(customerId: number): Promise<DbTransaction[]> {
    const output = await this.db.exec('transactions-by-customer', [String(customerId)]);
    return dbRowFactory
      .rows(output)
      .map((row) => dbRowFactory.transaction(row))
      .filter((transaction): transaction is DbTransaction => transaction !== null);
  }

  /** How many transactions an account holds. */
  async countByAccount(accountId: number): Promise<number> {
    const output = await this.db.exec('transaction-count-by-account', [String(accountId)]);
    return Number(output.trim());
  }

  /** How many transactions a customer holds across all their accounts. */
  async countByCustomer(customerId: number): Promise<number> {
    const output = await this.db.exec('transaction-count-by-customer', [String(customerId)]);
    return Number(output.trim());
  }

  /** Whether an account holds a transfer of the given amount. */
  async hasTransfer(accountId: number, amount: number): Promise<boolean> {
    const output = await this.db.exec('transfer-exists', [
      String(accountId),
      String(amount),
    ]);
    return output.trim() === 'true';
  }

  /** Whether an account holds a loan down-payment of the given amount. */
  async hasLoanPayment(accountId: number, amount: number): Promise<boolean> {
    const output = await this.db.exec('loan-payment-exists', [
      String(accountId),
      String(amount),
    ]);
    return output.trim() === 'true';
  }
}
