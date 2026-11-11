import type { DbAccount } from '../models/account.model';
import type { DbCustomer } from '../models/customer.model';
import type { DbTransaction } from '../models/transaction.model';

/**
 * The row factory.
 *
 * The JDBC helper reports rows as pipe-delimited text - one row per
 * line, fields in column order. The factory turns that wire format into
 * the suite's models, so no repository has to know how the helper
 * formats its output.
 *
 * ZERO ASSERTIONS: the factory maps, it does not judge. A row that does
 * not have the expected number of fields produces `null` rather than a
 * half-filled model.
 */
export const dbRowFactory = {
  /** Split the helper's stdout into non-empty rows. */
  rows(output: string): string[] {
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
  },

  /** Build a customer from a row, or `null` when the row is malformed. */
  customer(row: string): DbCustomer | null {
    const fields = row.split('|');
    if (fields.length < 9) {
      return null;
    }
    const [id, firstName, lastName, address, city, state, zipCode, phoneNumber, username] = fields;
    return {
      id: Number(id),
      firstName,
      lastName,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      username,
    };
  },

  /** Build an account from a row, or `null` when the row is malformed. */
  account(row: string): DbAccount | null {
    const fields = row.split('|');
    if (fields.length < 4) {
      return null;
    }
    const [id, customerId, type, balance] = fields;
    return {
      id: Number(id),
      customerId: Number(customerId),
      type: Number(type),
      balance: Number(balance),
    };
  },

  /** Build a transaction from a row, or `null` when the row is malformed. */
  transaction(row: string): DbTransaction | null {
    const fields = row.split('|');
    if (fields.length < 6) {
      return null;
    }
    const [id, accountId, type, date, amount, description] = fields;
    return {
      id: Number(id),
      accountId: Number(accountId),
      type: Number(type),
      date,
      amount: Number(amount),
      description,
    };
  },
};
