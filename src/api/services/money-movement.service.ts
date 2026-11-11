import type { ApiResult } from '../models/api-result.model';
import type { LoanResponse } from '../models/loan.model';
import type { Payee } from '../models/payee.model';
import type { ParaBankStrategy } from '../strategies/parabank-strategy';
import type { BillPayResult } from '../strategies/parabank-strategy';

/**
 * Money movement: deposits, withdrawals, transfers, loans and bills.
 *
 * ZERO ASSERTIONS.
 */
export class MoneyMovementService {
  constructor(private readonly strategy: ParaBankStrategy) {}

  /** Add money to an account. */
  async deposit(accountId: number, amount: string): Promise<ApiResult<string>> {
    return await this.strategy.deposit(accountId, amount);
  }

  /** Take money out of an account. */
  async withdraw(accountId: number, amount: string): Promise<ApiResult<string>> {
    return await this.strategy.withdraw(accountId, amount);
  }

  /** Move money between two accounts. */
  async transfer(
    fromAccountId: number,
    toAccountId: number,
    amount: string,
  ): Promise<ApiResult<string>> {
    return await this.strategy.transfer(fromAccountId, toAccountId, amount);
  }

  /** Apply for a loan; the loan is drawn from one of the customer's accounts. */
  async requestLoan(
    customerId: number,
    amount: string,
    downPayment: string,
    fromAccountId: number,
  ): Promise<ApiResult<LoanResponse>> {
    return await this.strategy.requestLoan(customerId, amount, downPayment, fromAccountId);
  }

  /** Pay a bill from an account. */
  async billPay(
    accountId: number,
    amount: string,
    payee?: Payee,
  ): Promise<ApiResult<BillPayResult>> {
    return await this.strategy.billPay(accountId, amount, payee);
  }
}
