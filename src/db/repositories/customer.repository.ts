import type { DbClient } from '../client/db-client';
import { dbRowFactory } from '../factories/row.factory';
import type { DbCustomer } from '../models/customer.model';

/**
 * CustomerRepository - reads ParaBank's `CUSTOMER` table.
 *
 * ZERO ASSERTIONS. A lookup that finds nothing returns `null`; the test
 * layer decides whether that is a failure.
 */
export class CustomerRepository {
  constructor(private readonly db: DbClient) {}

  /** The customer with this username, or `null`. */
  async findByUsername(username: string): Promise<DbCustomer | null> {
    const output = await this.db.exec('customer-by-username', [username]);
    const row = dbRowFactory.rows(output)[0];
    return row ? dbRowFactory.customer(row) : null;
  }

  /** The customer with this id, or `null`. */
  async findById(customerId: number): Promise<DbCustomer | null> {
    const output = await this.db.exec('customer-by-id', [String(customerId)]);
    const row = dbRowFactory.rows(output)[0];
    return row ? dbRowFactory.customer(row) : null;
  }

  /** How many customers the database holds. */
  async count(): Promise<number> {
    const output = await this.db.exec('customer-count');
    return Number(output.trim());
  }

  /** Whether a customer with this username exists. */
  async existsByUsername(username: string): Promise<boolean> {
    const output = await this.db.exec('customer-exists-username', [username]);
    return output.trim() === 'true';
  }
}
