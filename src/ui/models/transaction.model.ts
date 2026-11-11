/**
 * Transaction-shaped models for the UI suite.
 */

/** One row of the "Find Transactions" results table. */
export interface TransactionRow {
  /** The transaction id, taken from the row's detail link. */
  id: string;
  /** The description shown in the second column. */
  description: string;
  /** The amount shown in the third column. */
  amount: string;
  /** The date shown in the fourth column. */
  date: string;
}
