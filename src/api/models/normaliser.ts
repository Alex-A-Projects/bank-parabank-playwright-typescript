import type { Account } from './account.model';
import type { Customer } from './customer.model';
import type { HistoryPoint, Position } from './position.model';
import type { LoanResponse } from './loan.model';
import type { Transaction } from './transaction.model';
import type { BillPayResult } from '../strategies/parabank-strategy';

/**
 * Wire-format normalisation.
 *
 * The three transports spell the same field slightly differently - the
 * JSON body reports a transaction date as epoch milliseconds while the
 * XML bodies report an ISO-8601 string, for example. These helpers turn
 * whatever arrived into the suite's own model, so a test never has to
 * care which transport produced it.
 */

/** Normalise a date value to an ISO-8601 string. */
export function normaliseDate(value: unknown): string {
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return '';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Build an {@link Account} from a raw payload. */
export function toAccount(raw: unknown): Account {
  const account = asRecord(raw);
  return {
    id: Number(account.id),
    customerId: Number(account.customerId),
    type: String(account.type ?? ''),
    balance: Number(account.balance),
  };
}

/** Build a {@link Customer} from a raw payload. */
export function toCustomer(raw: unknown): Customer {
  const customer = asRecord(raw);
  const address = asRecord(customer.address);
  return {
    id: Number(customer.id),
    firstName: customer.firstName === undefined ? undefined : String(customer.firstName),
    lastName: customer.lastName === undefined ? undefined : String(customer.lastName),
    address: {
      street: address.street === undefined ? undefined : String(address.street),
      city: address.city === undefined ? undefined : String(address.city),
      state: address.state === undefined ? undefined : String(address.state),
      zipCode: address.zipCode === undefined ? undefined : String(address.zipCode),
    },
    phoneNumber:
      customer.phoneNumber === undefined ? undefined : String(customer.phoneNumber),
    ssn: customer.ssn === undefined ? undefined : String(customer.ssn),
  };
}

/** Build a {@link Transaction} from a raw payload. */
export function toTransaction(raw: unknown): Transaction {
  const transaction = asRecord(raw);
  return {
    id: Number(transaction.id),
    accountId: Number(transaction.accountId),
    type: String(transaction.type ?? ''),
    date: normaliseDate(transaction.date),
    amount: Number(transaction.amount),
    description:
      transaction.description === undefined ? undefined : String(transaction.description),
  };
}

/** Build a {@link Position} from a raw payload. */
export function toPosition(raw: unknown): Position {
  const position = asRecord(raw);
  return {
    positionId: Number(position.positionId),
    customerId: Number(position.customerId),
    name: position.name === undefined ? undefined : String(position.name),
    symbol: position.symbol === undefined ? undefined : String(position.symbol),
    shares: Number(position.shares),
    purchasePrice: Number(position.purchasePrice),
  };
}

/** Build a {@link HistoryPoint} from a raw payload. */
export function toHistoryPoint(raw: unknown): HistoryPoint {
  const point = asRecord(raw);
  return {
    symbol: point.symbol === undefined ? undefined : String(point.symbol),
    date: point.date === undefined ? undefined : normaliseDate(point.date),
    closingPrice:
      point.closingPrice === undefined ? undefined : Number(point.closingPrice),
  };
}

/** Build a {@link LoanResponse} from a raw payload. */
export function toLoanResponse(raw: unknown): LoanResponse {
  const loan = asRecord(raw);
  return {
    responseDate:
      loan.responseDate === undefined ? undefined : normaliseDate(loan.responseDate),
    loanProviderName:
      loan.loanProviderName === undefined ? undefined : String(loan.loanProviderName),
    approved: loan.approved === true || loan.approved === 'true',
    message: loan.message === undefined ? undefined : String(loan.message),
    accountId: loan.accountId === undefined ? undefined : Number(loan.accountId),
  };
}

/** Build a {@link BillPayResult} from a raw payload. */
export function toBillPayResult(raw: unknown): BillPayResult {
  const result = asRecord(raw);
  return {
    accountId: Number(result.accountId),
    amount: Number(result.amount),
    payeeName: result.payeeName === undefined ? undefined : String(result.payeeName),
  };
}

/**
 * Read a free-text result out of a payload.
 *
 * The money-movement operations answer with a single sentence, e.g.
 * "Successfully transferred $10.00 from account #12345 to account #12456".
 */
export function toResultText(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return '';
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw !== 'object') {
    return String(raw);
  }
  const record = raw as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 1) {
    const only = record[keys[0]];
    if (typeof only === 'string') {
      return only;
    }
  }
  // Fall back to the first string-valued field in the payload.
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return '';
}
