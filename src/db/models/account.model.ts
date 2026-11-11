/**
 * The account types ParaBank stores in `ACCOUNT.TYPE`.
 *
 * The numbers are the enum ordinals the application writes; they were
 * confirmed against the running database by the account queries.
 */
export const DbAccountType = {
  CHECKING: 0,
  SAVINGS: 1,
  LOAN: 2,
} as const;

export type DbAccountTypeName = keyof typeof DbAccountType;

/** The name of an account type, or `null` for an unknown code. */
export function accountTypeName(code: number): DbAccountTypeName | null {
  const entry = Object.entries(DbAccountType).find(([, value]) => value === code);
  return entry ? (entry[0] as DbAccountTypeName) : null;
}

/**
 * A row of ParaBank's `ACCOUNT` table.
 */
export interface DbAccount {
  /** `ACCOUNT.ID` */
  id: number;
  /** `ACCOUNT.CUSTOMER_ID` */
  customerId: number;
  /** `ACCOUNT.TYPE` - see {@link DbAccountType}. */
  type: number;
  /** `ACCOUNT.BALANCE` */
  balance: number;
}
