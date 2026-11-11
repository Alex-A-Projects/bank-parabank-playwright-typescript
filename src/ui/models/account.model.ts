/**
 * Account-shaped models for the UI suite.
 */

/**
 * ParaBank's account types.
 *
 * These are the values the application itself uses in the dropdowns and
 * in the `ACCOUNT.TYPE` column — `CHECKING`, `SAVINGS` and `LOAN`.
 */
export const AccountTypes = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  LOAN: 'LOAN',
} as const;

export type AccountType = (typeof AccountTypes)[keyof typeof AccountTypes];

/**
 * The account types a customer can actually open.
 *
 * `LOAN` is granted by ParaBank, never chosen on the "Open Account" form.
 */
export type OpenableAccountType = Exclude<AccountType, 'LOAN'>;

/** One row of the accounts overview table. */
export interface AccountSummary {
  accountNumber: string;
  balance: string;
}
