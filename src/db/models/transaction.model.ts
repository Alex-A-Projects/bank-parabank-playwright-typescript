/**
 * The transaction types ParaBank stores in `TRANSACTION.TYPE`.
 *
 * The column is an enum ordinal. The mapping below was confirmed
 * against the running database by reading the same rows through JDBC
 * and through the service API: a row with `TYPE = 0` is the one the API
 * reports as `Credit`, a row with `TYPE = 1` is the one it reports as
 * `Debit`.
 */
export const DbTransactionType = {
  CREDIT: 0,
  DEBIT: 1,
} as const;

export type DbTransactionTypeName = 'Credit' | 'Debit';

/**
 * The names the application itself reports for a transaction type.
 *
 * They are not the keys of {@link DbTransactionType}: ParaBank's
 * service layer writes `Credit` and `Debit` (in that spelling) into
 * its responses, and the database suite compares the two sides.
 */
const TRANSACTION_TYPE_NAMES: Record<number, DbTransactionTypeName> = {
  [DbTransactionType.CREDIT]: 'Credit',
  [DbTransactionType.DEBIT]: 'Debit',
};

/** The name of a transaction type, or `null` for an unknown code. */
export function transactionTypeName(code: number): DbTransactionTypeName | null {
  return TRANSACTION_TYPE_NAMES[code] ?? null;
}

/**
 * A row of ParaBank's `TRANSACTION` table.
 */
export interface DbTransaction {
  /** `TRANSACTION.ID` */
  id: number;
  /** `TRANSACTION.ACCOUNT_ID` */
  accountId: number;
  /** `TRANSACTION.TYPE` - see {@link DbTransactionType}. */
  type: number;
  /** `TRANSACTION.DATE` - the value as the driver renders it. */
  date: string;
  /** `TRANSACTION.AMOUNT` */
  amount: number;
  /** `TRANSACTION.DESCRIPTION` */
  description: string;
}
