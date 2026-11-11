import { SoapClient } from '../clients/soap.client';
import type { SoapArgValue } from '../clients/soap.client';
import { soapPayloadReader } from '../clients/payload-reader';
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
import type { BillPayResult, CustomerUpdate, ParaBankStrategy } from './parabank-strategy';

/**
 * Convert the payee model into the nested element the WSDL expects.
 *
 * The WSDL types the third bill-pay argument as a `payee` structure, so
 * it has to be sent as nested elements rather than as text.
 */
function toPayeeArgs(payee: Payee): Record<string, SoapArgValue> {
  const node: Record<string, SoapArgValue> = {};
  if (payee.accountNumber !== undefined) {
    node.accountNumber = payee.accountNumber;
  }
  if (payee.name !== undefined) {
    node.name = payee.name;
  }
  if (payee.phoneNumber !== undefined) {
    node.phoneNumber = payee.phoneNumber;
  }
  if (payee.address !== undefined) {
    const address: Record<string, SoapArgValue> = {};
    if (payee.address.street !== undefined) {
      address.street = payee.address.street;
    }
    if (payee.address.city !== undefined) {
      address.city = payee.address.city;
    }
    if (payee.address.state !== undefined) {
      address.state = payee.address.state;
    }
    if (payee.address.zipCode !== undefined) {
      address.zipCode = payee.address.zipCode;
    }
    node.address = address;
  }
  return node;
}

/**
 * SoapStrategy - ParaBank's SOAP transport.
 *
 * Every operation becomes one `soapenv:Envelope` posted to
 * `/parabank/services/ParaBank`, with the WSDL's parameter names as the
 * element names.
 *
 * The response element names below are the ones the published WSDL
 * declares - for example `loginResponse` holds a `customerId` element
 * carrying the whole customer record, and `billPayResponse` holds a
 * `return` element carrying the bill-pay result.
 */
export class SoapStrategy extends StrategyBase implements ParaBankStrategy {
  readonly id = 'soap' as const;
  readonly description = 'ParaBank SOAP service (/services/ParaBank)';

  protected readonly reader: PayloadReader = soapPayloadReader;

  constructor(private readonly soap: SoapClient) {
    super();
  }

  async login(username: string, password: string): Promise<ApiResult<Customer>> {
    const raw = await this.soap.call('login', { username, password });
    // The SOAP login response wraps the customer record in a `customerId`
    // element - that is how the WSDL types it.
    return this.toSingle<Customer>(raw, 'login', 'customerId', toCustomer);
  }

  async getCustomer(customerId: number): Promise<ApiResult<Customer>> {
    const raw = await this.soap.call('getCustomer', { customerId });
    return this.toSingle<Customer>(raw, 'getCustomer', 'customer', toCustomer);
  }

  async updateCustomer(
    customerId: number,
    fields: CustomerUpdate,
  ): Promise<ApiResult<string>> {
    const raw = await this.soap.call('updateCustomer', { customerId, ...fields });
    return this.toText(raw, 'updateCustomer', 'customerUpdateResult');
  }

  async getAccounts(customerId: number): Promise<ApiResult<Account[]>> {
    const raw = await this.soap.call('getAccounts', { customerId });
    return this.toCollection<Account>(raw, 'getAccounts', 'account', toAccount);
  }

  async getAccount(accountId: number): Promise<ApiResult<Account>> {
    const raw = await this.soap.call('getAccount', { accountId });
    return this.toSingle<Account>(raw, 'getAccount', 'account', toAccount);
  }

  async createAccount(
    customerId: number,
    newAccountType: string,
    fromAccountId: number,
  ): Promise<ApiResult<Account>> {
    const raw = await this.soap.call('createAccount', { customerId, newAccountType, fromAccountId });
    return this.toSingle<Account>(raw, 'createAccount', 'account', toAccount);
  }

  async getTransactions(accountId: number): Promise<ApiResult<Transaction[]>> {
    const raw = await this.soap.call('getTransactions', { accountId });
    return this.toCollection<Transaction>(raw, 'getTransactions', 'transaction', toTransaction);
  }

  async getTransaction(transactionId: number): Promise<ApiResult<Transaction>> {
    const raw = await this.soap.call('getTransaction', { transactionId });
    return this.toSingle<Transaction>(raw, 'getTransaction', 'transaction', toTransaction);
  }

  async getTransactionsByAmount(
    accountId: number,
    amount: string,
  ): Promise<ApiResult<Transaction[]>> {
    const raw = await this.soap.call('getTransactionsByAmount', { accountId, amount });
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
    const raw = await this.soap.call('getTransactionsOnDate', { accountId, onDate });
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
    const raw = await this.soap.call('getTransactionsByToFromDate', {
      accountId,
      fromDate,
      toDate,
    });
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
    const raw = await this.soap.call('getTransactionsByMonthAndType', {
      accountId,
      month,
      type,
    });
    return this.toCollection<Transaction>(
      raw,
      'getTransactionsByMonthAndType',
      'transaction',
      toTransaction,
    );
  }

  async deposit(accountId: number, amount: string): Promise<ApiResult<string>> {
    const raw = await this.soap.call('deposit', { accountId, amount });
    return this.toText(raw, 'deposit', 'depositReturn');
  }

  async withdraw(accountId: number, amount: string): Promise<ApiResult<string>> {
    const raw = await this.soap.call('withdraw', { accountId, amount });
    return this.toText(raw, 'withdraw', 'withdrawReturn');
  }

  async transfer(
    fromAccountId: number,
    toAccountId: number,
    amount: string,
  ): Promise<ApiResult<string>> {
    const raw = await this.soap.call('transfer', { fromAccountId, toAccountId, amount });
    return this.toText(raw, 'transfer', 'transferReturn');
  }

  async requestLoan(
    customerId: number,
    amount: string,
    downPayment: string,
    fromAccountId: number,
  ): Promise<ApiResult<LoanResponse>> {
    const raw = await this.soap.call('requestLoan', {
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
    // The WSDL declares the bill-pay operation with three unnamed
    // arguments, the third being a `payee` structure.
    const raw = await this.soap.call('billPay', {
      arg0: accountId,
      arg1: amount,
      arg2: payee ? toPayeeArgs(payee) : {},
    });
    return this.toSingle<BillPayResult>(raw, 'billPay', 'return', toBillPayResult);
  }

  async getPositions(customerId: number): Promise<ApiResult<Position[]>> {
    const raw = await this.soap.call('getPositions', { customerId });
    return this.toCollection<Position>(raw, 'getPositions', 'position', toPosition);
  }

  async getPosition(positionId: number): Promise<ApiResult<Position>> {
    const raw = await this.soap.call('getPosition', { positionId });
    return this.toSingle<Position>(raw, 'getPosition', 'position', toPosition);
  }

  async getPositionHistory(
    positionId: number,
    startDate: string,
    endDate: string,
  ): Promise<ApiResult<HistoryPoint[]>> {
    const raw = await this.soap.call('getPositionHistory', { positionId, startDate, endDate });
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
    const raw = await this.soap.call('buyPosition', {
      customerId,
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
    const raw = await this.soap.call('sellPosition', {
      customerId,
      accountId,
      positionId,
      shares,
      pricePerShare,
    });
    return this.toCollection<Position>(raw, 'sellPosition', 'position', toPosition);
  }

  async setParameter(name: string, value: string): Promise<ApiResult<void>> {
    // The WSDL declares `setParameterResponse` as an empty sequence.
    const raw = await this.soap.call('setParameter', { name, value });
    return this.toVoid(raw);
  }

  async initializeDb(): Promise<ApiResult<void>> {
    const raw = await this.soap.call('initializeDB');
    return this.toVoid(raw);
  }

  async cleanDb(): Promise<ApiResult<void>> {
    const raw = await this.soap.call('cleanDB');
    return this.toVoid(raw);
  }

  async startupJmsListener(): Promise<ApiResult<void>> {
    const raw = await this.soap.call('startupJmsListener');
    return this.toVoid(raw);
  }

  async shutdownJmsListener(): Promise<ApiResult<void>> {
    const raw = await this.soap.call('shutdownJmsListener');
    return this.toVoid(raw);
  }
}
