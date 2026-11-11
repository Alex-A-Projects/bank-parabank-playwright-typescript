import type { DbClient } from '../client/db-client';

/**
 * LoanRepository - reads the loan side of ParaBank's `ACCOUNT` table.
 *
 * A loan is an account of type `LOAN` plus the down-payment transaction
 * that funded it, so the two live together here.
 *
 * ZERO ASSERTIONS.
 */
export class LoanRepository {
  constructor(private readonly db: DbClient) {}

  /** How many loan accounts a customer holds. */
  async countByCustomer(customerId: number): Promise<number> {
    const output = await this.db.exec('loan-accounts-by-customer', [String(customerId)]);
    return Number(output.trim());
  }

  /** Whether a customer holds a loan account with the given balance. */
  async hasAccount(customerId: number, balance: number): Promise<boolean> {
    const output = await this.db.exec('loan-account-exists', [
      String(customerId),
      String(balance),
    ]);
    return output.trim() === 'true';
  }
}
