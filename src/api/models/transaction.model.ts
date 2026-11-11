/**
 * Transaction-shaped DTOs for the API suite.
 */

/**
 * ParaBank's transaction types.
 *
 * Note that the *database* stores both debits and credits with
 * `TRANSACTION.TYPE = 1` and disambiguates them by description; the API
 * is explicit and reports `Credit` / `Debit`.
 */
export const TransactionTypes = {
  CREDIT: 'Credit',
  DEBIT: 'Debit',
} as const;

export type TransactionType = (typeof TransactionTypes)[keyof typeof TransactionTypes];

export interface Transaction {
  id: number;
  accountId: number;
  type: TransactionType | string;
  /** ISO-8601 timestamp, normalised from the wire format. */
  date: string;
  amount: number;
  description?: string;
}
