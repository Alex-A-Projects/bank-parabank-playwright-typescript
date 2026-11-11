/**
 * Account-shaped DTOs for the API suite.
 */

/** ParaBank's account types, as returned by `getAccount`/`getAccounts`. */
export const AccountTypes = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  LOAN: 'LOAN',
} as const;

export type AccountType = (typeof AccountTypes)[keyof typeof AccountTypes];

export interface Account {
  id: number;
  customerId: number;
  type: AccountType | string;
  balance: number;
}
