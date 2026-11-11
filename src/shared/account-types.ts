/**
 * Account types - the vocabulary ParaBank uses for accounts.
 *
 * Two different spellings of the same concept, both confirmed against
 * the running application:
 *
 *   - the **code** (`0` / `1` / `2`) is what a caller *gives* the
 *     service: `createAccount` declares `newAccountType` as `xs:int`
 *     in both the SOAP WSDL and the REST WADL, and ParaBank stores the
 *     same ordinal in `ACCOUNT.TYPE`;
 *   - the **name** (`CHECKING` / `SAVINGS` / `LOAN`) is what the service
 *     *answers* with: it is the WSDL's `accountType` simple type and the
 *     value of the `type` field on every account the API returns.
 *
 * It lives here, in the shared layer, because both the API suite and
 * the database suite need it and the shared layer is the only place the
 * two may meet.
 */

/** The numeric account-type codes ParaBank accepts and stores. */
export const AccountTypeCode = {
  CHECKING: '0',
  SAVINGS: '1',
  LOAN: '2',
} as const;

export type AccountTypeCodeValue = (typeof AccountTypeCode)[keyof typeof AccountTypeCode];

/** The account-type names ParaBank answers with. */
export const AccountTypeNames = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  LOAN: 'LOAN',
} as const;

export type AccountTypeName = (typeof AccountTypeNames)[keyof typeof AccountTypeNames];

/**
 * The account type a code stands for, or `null` for an unknown code.
 *
 * @example accountTypeNameFor('1') // 'SAVINGS'
 */
export function accountTypeNameFor(code: string | number): AccountTypeName | null {
  const numeric = String(code).trim();
  const entry = Object.entries(AccountTypeCode).find(([, value]) => value === numeric);
  return entry ? (entry[0] as AccountTypeName) : null;
}
