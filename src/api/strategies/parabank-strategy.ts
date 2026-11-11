import type { ApiResult } from '../models/api-result.model';
import type { Account } from '../models/account.model';
import type { Customer } from '../models/customer.model';
import type { HistoryPoint, Position } from '../models/position.model';
import type { LoanResponse } from '../models/loan.model';
import type { Payee } from '../models/payee.model';
import type { Transaction } from '../models/transaction.model';

/** The transports the API suite can speak. */
export type StrategyId = 'soap' | 'rest-json' | 'rest-xml';

/**
 * The fields ParaBank's `updateCustomer` operation accepts.
 *
 * The set is fixed by the WSDL: the customer is replaced wholesale, so
 * every field has to be sent, including the username and password.
 */
export interface CustomerUpdate {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  ssn: string;
  username: string;
  password: string;
}

/** The result of a bill payment. */
export interface BillPayResult {
  accountId: number;
  amount: number;
  payeeName?: string;
}

/**
 * ParaBankStrategy - the Strategy pattern for the API suite.
 *
 * ParaBank publishes the same banking operations over three transports:
 * SOAP, REST with a JSON body and REST with an XML body. A strategy hides
 * that choice behind one interface, so a test can say "log in" without
 * caring how the request is framed, and the same test body can be run
 * against every transport.
 *
 * Every method answers with an {@link ApiResult}: the HTTP status, the
 * parsed payload, the error message when the call failed, and the raw
 * response. Nothing here decides what a correct answer looks like.
 *
 * ZERO ASSERTIONS. A strategy reports what came back; the service and
 * test layers decide what is correct.
 */
export interface ParaBankStrategy {
  /** Which transport this strategy speaks. */
  readonly id: StrategyId;
  /** A human-readable description, used in the run banner and in reports. */
  readonly description: string;

  login(username: string, password: string): Promise<ApiResult<Customer>>;
  getCustomer(customerId: number): Promise<ApiResult<Customer>>;
  updateCustomer(customerId: number, fields: CustomerUpdate): Promise<ApiResult<string>>;

  getAccounts(customerId: number): Promise<ApiResult<Account[]>>;
  getAccount(accountId: number): Promise<ApiResult<Account>>;
  createAccount(
    customerId: number,
    newAccountType: string,
    fromAccountId: number,
  ): Promise<ApiResult<Account>>;

  getTransactions(accountId: number): Promise<ApiResult<Transaction[]>>;
  getTransaction(transactionId: number): Promise<ApiResult<Transaction>>;
  getTransactionsByAmount(accountId: number, amount: string): Promise<ApiResult<Transaction[]>>;
  getTransactionsOnDate(accountId: number, onDate: string): Promise<ApiResult<Transaction[]>>;
  getTransactionsByToFromDate(
    accountId: number,
    fromDate: string,
    toDate: string,
  ): Promise<ApiResult<Transaction[]>>;
  getTransactionsByMonthAndType(
    accountId: number,
    month: string,
    type: string,
  ): Promise<ApiResult<Transaction[]>>;

  deposit(accountId: number, amount: string): Promise<ApiResult<string>>;
  withdraw(accountId: number, amount: string): Promise<ApiResult<string>>;
  transfer(
    fromAccountId: number,
    toAccountId: number,
    amount: string,
  ): Promise<ApiResult<string>>;
  requestLoan(
    customerId: number,
    amount: string,
    downPayment: string,
    fromAccountId: number,
  ): Promise<ApiResult<LoanResponse>>;
  billPay(
    accountId: number,
    amount: string,
    payee?: Payee,
  ): Promise<ApiResult<BillPayResult>>;

  getPositions(customerId: number): Promise<ApiResult<Position[]>>;
  getPosition(positionId: number): Promise<ApiResult<Position>>;
  getPositionHistory(
    positionId: number,
    startDate: string,
    endDate: string,
  ): Promise<ApiResult<HistoryPoint[]>>;
  buyPosition(
    customerId: number,
    accountId: number,
    name: string,
    symbol: string,
    shares: number,
    pricePerShare: string,
  ): Promise<ApiResult<Position[]>>;
  sellPosition(
    customerId: number,
    accountId: number,
    positionId: number,
    shares: number,
    pricePerShare: string,
  ): Promise<ApiResult<Position[]>>;

  setParameter(name: string, value: string): Promise<ApiResult<void>>;
  initializeDb(): Promise<ApiResult<void>>;
  cleanDb(): Promise<ApiResult<void>>;
  startupJmsListener(): Promise<ApiResult<void>>;
  shutdownJmsListener(): Promise<ApiResult<void>>;
}
