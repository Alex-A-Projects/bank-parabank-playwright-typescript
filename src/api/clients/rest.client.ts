import { HttpClient } from './http.client';
import type { QueryParams } from './http.client';
import type { ApiResponse } from '../models/api-response.model';

/** The payload format the REST endpoint should answer in. */
export type RestFormat = 'json' | 'xml';

/**
 * Every REST route ParaBank publishes, in one place.
 *
 * The paths come from the service's own WADL
 * (`/parabank/services/bank?_wadl&_type=xml`). Keeping them here means
 * no endpoint name is ever spelled out as a literal in a test.
 */
export const RestPaths = {
  root: () => '',
  customer: (customerId: number) => `customers/${customerId}`,
  customerAccounts: (customerId: number) => `customers/${customerId}/accounts`,
  customerPositions: (customerId: number) => `customers/${customerId}/positions`,
  customerUpdate: (customerId: number) => `customers/update/${customerId}`,
  buyPosition: (customerId: number) => `customers/${customerId}/buyPosition`,
  sellPosition: (customerId: number) => `customers/${customerId}/sellPosition`,
  account: (accountId: number) => `accounts/${accountId}`,
  accountTransactions: (accountId: number) => `accounts/${accountId}/transactions`,
  accountTransactionsByAmount: (accountId: number, amount: string) =>
    `accounts/${accountId}/transactions/amount/${amount}`,
  accountTransactionsByDateRange: (accountId: number, fromDate: string, toDate: string) =>
    `accounts/${accountId}/transactions/fromDate/${fromDate}/toDate/${toDate}`,
  accountTransactionsByMonthAndType: (accountId: number, month: string, type: string) =>
    `accounts/${accountId}/transactions/month/${month}/type/${type}`,
  accountTransactionsOnDate: (accountId: number, onDate: string) =>
    `accounts/${accountId}/transactions/onDate/${onDate}`,
  transaction: (transactionId: number) => `transactions/${transactionId}`,
  position: (positionId: number) => `positions/${positionId}`,
  positionHistory: (positionId: number, startDate: string, endDate: string) =>
    `positions/${positionId}/${startDate}/${endDate}`,
  login: (username: string, password: string) => `login/${username}/${password}`,
  billPay: () => 'billpay',
  cleanDb: () => 'cleanDB',
  createAccount: () => 'createAccount',
  deposit: () => 'deposit',
  initializeDb: () => 'initializeDB',
  requestLoan: () => 'requestLoan',
  setParameter: (name: string, value: string) => `setParameter/${name}/${value}`,
  shutdownJmsListener: () => 'shutdownJmsListener',
  startupJmsListener: () => 'startupJmsListener',
  transfer: () => 'transfer',
  withdraw: () => 'withdraw',
} as const;

/**
 * RestClient - talks to ParaBank's REST endpoint.
 *
 * ZERO ASSERTIONS. It knows the route shapes and the payload format; it
 * does not interpret the results.
 */
export class RestClient {
  /**
   * @param http     the HTTP transport
   * @param basePath the REST root, relative to the base URL
   * @param format   the payload format to ask for
   */
  constructor(
    private readonly http: HttpClient,
    private readonly basePath = '/services/bank',
    private readonly format: RestFormat = 'json',
  ) {}

  /** The payload format this client asks the server for. */
  get payloadFormat(): RestFormat {
    return this.format;
  }

  /** The `Accept` header matching the configured format. */
  private headers(): Record<string, string> {
    return { Accept: this.format === 'json' ? 'application/json' : 'application/xml' };
  }

  /** Send a GET request to a REST route. */
  async get(path: string, query?: QueryParams): Promise<ApiResponse> {
    return await this.http.get(`${this.basePath}/${path}`, {
      query,
      headers: this.headers(),
    });
  }

  /** Send a POST request to a REST route. */
  async post(path: string, query?: QueryParams, body?: RestBody): Promise<ApiResponse> {
    const headers = this.headers();
    let data: string | undefined;

    if (body !== undefined) {
      // Some routes - the bill-pay route among them - answer HTTP 415
      // ("Unsupported Media Type") when the request carries no
      // representation at all, so the body is not optional for them.
      headers['Content-Type'] =
        this.format === 'json' ? 'application/json' : 'application/xml';
      data =
        this.format === 'json'
          ? JSON.stringify(body.value)
          : toXml(body.value, body.root ?? 'request');
    }

    return await this.http.post(`${this.basePath}/${path}`, {
      query,
      headers,
      data,
    });
  }
}

/**
 * The body of a REST POST.
 *
 * `root` names the XML root element; it is ignored for JSON, where the
 * payload is sent as a plain object.
 */
export interface RestBody {
  /** The XML root element name. Defaults to `request`. */
  root?: string;
  /** The payload. */
  value: unknown;
}

/**
 * Serialise a plain object as XML.
 *
 * Nested objects become nested elements; `undefined` and `null` members
 * are left out entirely, so an absent field is absent from the request
 * rather than sent as an empty string.
 */
function toXml(value: unknown, rootName: string): string {
  if (value === null || value === undefined) {
    return `<${rootName}/>`;
  }
  if (typeof value !== 'object') {
    return `<${rootName}>${escapeXml(String(value))}</${rootName}>`;
  }

  const members = Object.entries(value as Record<string, unknown>).filter(
    ([, member]) => member !== undefined && member !== null,
  );
  if (members.length === 0) {
    return `<${rootName}/>`;
  }

  const inner = members.map(([name, member]) => toXml(member, name)).join('');
  return `<${rootName}>${inner}</${rootName}>`;
}

/** Escape the five XML entities. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
