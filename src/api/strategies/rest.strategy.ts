import { RestClient, RestPaths } from '../clients/rest.client';
import { restPayloadReader } from '../clients/payload-reader';
import type { PayloadReader } from '../clients/payload-reader';
import {
  toAccount,
  toBillPayResult,
  toCustomer,
  toHistoryPoint,
  toLoanResponse,
  toPosition,
  toTransaction,
} from '../models/normaliser';
import type { ApiResult } from '../models/api-result.model';
import type { Account } from '../models/account.model';
import type { Customer } from '../models/customer.model';
import type { HistoryPoint, Position } from '../models/position.model';
import type { LoanResponse } from '../models/loan.model';
import type { Payee } from '../models/payee.model';
import type { Transaction } from '../models/transaction.model';
import { StrategyBase } from './strategy-base';
import type { BillPayResult, CustomerUpdate, ParaBankStrategy, StrategyId } from './parabank-strategy';

/**
 * RestStrategy - ParaBank's REST transport.
 *
 * The same strategy covers both payload formats; the client is built with
 * the format the caller asked for and sends the matching `Accept` header.
 * The reader sniffs what actually came back, so a server that answers in
 * the other format is still read correctly.
 *
 * Every route comes from the service's own WADL and is referenced through
 * {@link RestPaths} - no endpoint name is spelled out here.
 */
export class RestStrategy extends StrategyBase implements ParaBankStrategy {
  readonly id: StrategyId;
  readonly description: string;

  protected readonly reader: PayloadReader = restPayloadReader;

  constructor(private readonly rest: RestClient) {
    super();
    const format = rest.payloadFormat;
    this.id = format === 'json' ? 'rest-json' : 'rest-xml';
    this.description = `ParaBank REST service (/services/bank, ${format.toUpperCase()})`;
  }

  async login(username: string, password: string): Promise<ApiResult<Customer>> {
    const raw = await this.rest.get(RestPaths.login(username, password));
    return this.toSingle<Customer>(raw, 'login', 'customer', toCustomer);
  }

  async getCustomer(customerId: number): Promise<ApiResult<Customer>> {
    const raw = await this.rest.get(RestPaths.customer(customerId));
    return this.toSingle<Customer>(raw, 'getCustomer', 'customer', toCustomer);
  }

  async updateCustomer(
    customerId: number,
    fields: CustomerUpdate,
  ): Promise<ApiResult<string>> {
    const raw = await this.rest.post(RestPaths.customerUpdate(customerId), { ...fields });
    return this.toText(raw, 'updateCustomer', 'result');
  }

  async getAccounts(customerId: number): Promise<ApiResult<Account[]>> {
    const raw = await this.rest.get(RestPaths.customerAccounts(customerId));
    return this.toCollection<Account>(raw, 'getAccounts', 'account', toAccount);
  }

  async getAccount(accountId: number): Promise<ApiResult<Account>> {
    const raw = await this.rest.get(RestPaths.account(accountId));
    return this.toSingle<Account>(raw, 'getAccount', 'account', toAccount);
  }

  async createAccount(
    customerId: number,
    newAccountType: string,
    fromAccountId: number,
  ): Promise<ApiResult<Account>> {
    const raw = await this.rest.post(RestPaths.createAccount(), {
      customerId,
      newAccountType,
      fromAccountId,
    });
    return this.toSingle<Account>(raw, 'createAccount', 'account', toAccount);
  }

  async getTransactions(accountId: number): Promise<ApiResult<Transaction[]>> {
    const raw = await this.rest.get(RestPaths.accountTransactions(accountId));
    return this.toCollection<Transaction>(raw, 'getTransactions', 'transaction', toTransaction);
  }

  async getTransaction(transactionId: number): Promise<ApiResult<Transaction>> {
    const raw = await this.rest.get(RestPaths.transaction(transactionId));
    return this.toSingle<Transaction>(raw, 'getTransaction', 'transaction', toTransaction);
  }

  async getTransactionsByAmount(
    accountId: number,
    amount: string,
  ): Promise<ApiResult<Transaction[]>> {
    const raw = await this.rest.get(RestPaths.accountTransactionsByAmount(accountId, amount));
    return this.toCollection<Transaction>(
      raw,
      'getTransactionsByAmount',
      'transaction',
      toTransaction,
    );
  }

  async getTransactionsOnDate(
    accountId: number,
    onDate: string,
  ): Promise<ApiResult<Transaction[]>> {
    const raw = await this.rest.get(RestPaths.accountTransactionsOnDate(accountId, onDate));
    return this.toCollection<Transaction>(
      raw,
      'getTransactionsOnDate',
      'transaction',
      toTransaction,
    );
  }

  async getTransactionsByToFromDate(
    accountId: number,
    fromDate: string,
    toDate: string,
  ): Promise<ApiResult<Transaction[]>> {
    const raw = await this.rest.get(RestPaths.accountTransactionsByDateRange(accountId, fromDate, toDate));
    return this.toCollection<Transaction>(
      raw,
      'getTransactionsByToFromDate',
      'transaction',
      toTransaction,
    );
  }

  async getTransactionsByMonthAndType(
    accountId: number,
    month: string,
    type: string,
  ): Promise<ApiResult<Transaction[]>> {
    const raw = await this.rest.get(
      RestPaths.accountTransactionsByMonthAndType(accountId, month, type),
    );
    return this.toCollection<Transaction>(
      raw,
      'getTransactionsByMonthAndType',
      'transaction',
      toTransaction,
    );
  }

  async deposit(accountId: number, amount: string): Promise<ApiResult<string>> {
    const raw = await this.rest.post(RestPaths.deposit(), { accountId, amount });
    return this.toText(raw, 'deposit', 'result');
  }

  async withdraw(accountId: number, amount: string): Promise<ApiResult<string>> {
    const raw = await this.rest.post(RestPaths.withdraw(), { accountId, amount });
    return this.toText(raw, 'withdraw', 'result');
  }

  async transfer(
    fromAccountId: number,
    toAccountId: number,
    amount: string,
  ): Promise<ApiResult<string>> {
    const raw = await this.rest.post(RestPaths.transfer(), { fromAccountId, toAccountId, amount });
    return this.toText(raw, 'transfer', 'result');
  }

  async requestLoan(
    customerId: number,
    amount: string,
    downPayment: string,
    fromAccountId: number,
  ): Promise<ApiResult<LoanResponse>> {
    const raw = await this.rest.post(RestPaths.requestLoan(), {
      customerId,
      amount,
      downPayment,
      fromAccountId,
    });
    return this.toSingle<LoanResponse>(raw, 'requestLoan', 'loanResponse', toLoanResponse);
  }

  async billPay(
    accountId: number,
    amount: string,
    payee?: Payee,
  ): Promise<ApiResult<BillPayResult>> {
    // The WADL's bill-pay operation takes the account and the amount as
    // query parameters and the payee as the request body. Without a body
    // the route answers HTTP 415, so one is always sent.
    const raw = await this.rest.post(
      RestPaths.billPay(),
      { accountId, amount },
      { root: 'payee', value: payee ?? {} },
    );
    return this.toSingle<BillPayResult>(raw, 'billPay', 'billPayResult', toBillPayResult);
  }

  async getPositions(customerId: number): Promise<ApiResult<Position[]>> {
    const raw = await this.rest.get(RestPaths.customerPositions(customerId));
    return this.toCollection<Position>(raw, 'getPositions', 'position', toPosition);
  }

  async getPosition(positionId: number): Promise<ApiResult<Position>> {
    const raw = await this.rest.get(RestPaths.position(positionId));
    return this.toSingle<Position>(raw, 'getPosition', 'position', toPosition);
  }

  async getPositionHistory(
    positionId: number,
    startDate: string,
    endDate: string,
  ): Promise<ApiResult<HistoryPoint[]>> {
    const raw = await this.rest.get(RestPaths.positionHistory(positionId, startDate, endDate));
    return this.toCollection<HistoryPoint>(
      raw,
      'getPositionHistory',
      'historyPoint',
      toHistoryPoint,
    );
  }

  async buyPosition(
    customerId: number,
    accountId: number,
    name: string,
    symbol: string,
    shares: number,
    pricePerShare: string,
  ): Promise<ApiResult<Position[]>> {
    const raw = await this.rest.post(RestPaths.buyPosition(customerId), {
      accountId,
      name,
      symbol,
      shares,
      pricePerShare,
    });
    return this.toCollection<Position>(raw, 'buyPosition', 'position', toPosition);
  }

  async sellPosition(
    customerId: number,
    accountId: number,
    positionId: number,
    shares: number,
    pricePerShare: string,
  ): Promise<ApiResult<Position[]>> {
    const raw = await this.rest.post(RestPaths.sellPosition(customerId), {
      accountId,
      positionId,
      shares,
      pricePerShare,
    });
    return this.toCollection<Position>(raw, 'sellPosition', 'position', toPosition);
  }

  async setParameter(name: string, value: string): Promise<ApiResult<void>> {
    const raw = await this.rest.post(RestPaths.setParameter(name, value));
    return this.toVoid(raw);
  }

  async initializeDb(): Promise<ApiResult<void>> {
    const raw = await this.rest.post(RestPaths.initializeDb());
    return this.toVoid(raw);
  }

  async cleanDb(): Promise<ApiResult<void>> {
    const raw = await this.rest.post(RestPaths.cleanDb());
    return this.toVoid(raw);
  }

  async startupJmsListener(): Promise<ApiResult<void>> {
    const raw = await this.rest.post(RestPaths.startupJmsListener());
    return this.toVoid(raw);
  }

  async shutdownJmsListener(): Promise<ApiResult<void>> {
    const raw = await this.rest.post(RestPaths.shutdownJmsListener());
    return this.toVoid(raw);
  }
}
