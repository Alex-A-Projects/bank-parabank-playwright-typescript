import type { ApiResult } from '../models/api-result.model';
import type { Account } from '../models/account.model';
import type { ParaBankStrategy } from '../strategies/parabank-strategy';
import { AccountTypeCode } from '../../shared/account-types';
import type { AccountTypeCodeValue } from '../../shared/account-types';

export { AccountTypeCode, AccountTypeNames } from '../../shared/account-types';
export type { AccountTypeCodeValue, AccountTypeName } from '../../shared/account-types';

/**
 * Account operations.
 *
 * ZERO ASSERTIONS.
 */
export class AccountService {
  constructor(private readonly strategy: ParaBankStrategy) {}

  /** Every account a customer owns. */
  async list(customerId: number): Promise<ApiResult<Account[]>> {
    return await this.strategy.getAccounts(customerId);
  }

  /** One account by id. */
  async get(accountId: number): Promise<ApiResult<Account>> {
    return await this.strategy.getAccount(accountId);
  }

  /**
   * Open a new account for a customer, funded from one of their accounts.
   *
   * `newAccountType` is the numeric account-type code - see
   * {@link AccountTypeCode}.
   */
  async open(
    customerId: number,
    newAccountType: AccountTypeCodeValue | string,
    fromAccountId: number,
  ): Promise<ApiResult<Account>> {
    return await this.strategy.createAccount(customerId, newAccountType, fromAccountId);
  }

  /** The sum of the balances of the given accounts. */
  totalBalance(accounts: readonly Account[]): number {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  /** The accounts of the given type. */
  byType(accounts: readonly Account[], type: string): Account[] {
    return accounts.filter((account) => account.type === type);
  }
}
