import type { DbClient } from '../client/db-client';
import { dbRowFactory } from '../factories/row.factory';
import type { DbAccount } from '../models/account.model';

/**
 * AccountRepository - reads ParaBank's `ACCOUNT` table.
 *
 * ZERO ASSERTIONS.
 */
export class AccountRepository {
  constructor(private readonly db: DbClient) {}

  /** The account with this id, or `null`. */
  async findById(accountId: number): Promise<DbAccount | null> {
    const output = await this.db.exec('account-by-id', [String(accountId)]);
    const row = dbRowFactory.rows(output)[0];
    return row ? dbRowFactory.account(row) : null;
  }

  /** Every account a customer owns, ordered by id. */
  async findByCustomer(customerId: number): Promise<DbAccount[]> {
    const output = await this.db.exec('accounts-by-customer', [String(customerId)]);
    return dbRowFactory
      .rows(output)
      .map((row) => dbRowFactory.account(row))
      .filter((account): account is DbAccount => account !== null);
  }

  /** How many accounts a customer owns. */
  async countByCustomer(customerId: number): Promise<number> {
    const output = await this.db.exec('account-count-by-customer', [String(customerId)]);
    return Number(output.trim());
  }

  /** The balance of an account, or `null` when the account does not exist. */
  async balanceOf(accountId: number): Promise<number | null> {
    const output = await this.db.exec('account-balance', [String(accountId)]);
    const trimmed = output.trim();
    return trimmed === '' ? null : Number(trimmed);
  }
}
