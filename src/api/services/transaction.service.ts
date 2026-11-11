import type { ApiResult } from '../models/api-result.model';
import type { Transaction } from '../models/transaction.model';
import type { ParaBankStrategy } from '../strategies/parabank-strategy';

/**
 * Transaction operations.
 *
 * ZERO ASSERTIONS.
 */
export class TransactionService {
  constructor(private readonly strategy: ParaBankStrategy) {}

  /** Every transaction on an account. */
  async list(accountId: number): Promise<ApiResult<Transaction[]>> {
    return await this.strategy.getTransactions(accountId);
  }

  /** One transaction by id. */
  async get(transactionId: number): Promise<ApiResult<Transaction>> {
    return await this.strategy.getTransaction(transactionId);
  }

  /** The transactions of an account with exactly the given amount. */
  async findByAmount(accountId: number, amount: string): Promise<ApiResult<Transaction[]>> {
    return await this.strategy.getTransactionsByAmount(accountId, amount);
  }

  /** The transactions of an account booked on one date. */
  async findOnDate(accountId: number, onDate: string): Promise<ApiResult<Transaction[]>> {
    return await this.strategy.getTransactionsOnDate(accountId, onDate);
  }

  /** The transactions of an account booked inside a date range. */
  async findInRange(
    accountId: number,
    fromDate: string,
    toDate: string,
  ): Promise<ApiResult<Transaction[]>> {
    return await this.strategy.getTransactionsByToFromDate(accountId, fromDate, toDate);
  }

  /** The transactions of an account booked in a month with a given type. */
  async findByMonthAndType(
    accountId: number,
    month: string,
    type: string,
  ): Promise<ApiResult<Transaction[]>> {
    return await this.strategy.getTransactionsByMonthAndType(accountId, month, type);
  }

  /** The sum of the amounts of the given transactions. */
  total(transactions: readonly Transaction[]): number {
    return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }
}
