import type { APIRequestContext } from '@playwright/test';
import type { CustomerPayload } from '../../shared/factories';
import type { AccountTypeCodeValue } from '../../shared/account-types';

export { AccountTypeCode } from '../../shared/account-types';
export type { AccountTypeCodeValue } from '../../shared/account-types';

/**
 * The result of a driver call.
 *
 * The driver reports what the application answered; the test layer
 * decides whether the answer is the expected one.
 */
export interface DriverResponse {
  /** HTTP status code. */
  status: number;
  /** The raw response body. */
  body: string;
}

/**
 * ParaBankAppDriver - the write path of the database suite.
 *
 * The database suite verifies that what the application writes really
 * lands in the database. It therefore has to write *through* the
 * application - never directly into the tables.
 *
 * Two entry points are used, and both are the ones the application
 * itself uses:
 *
 *   - the registration form (`register.htm`) - the only way to create a
 *     customer; the service API has no registration operation;
 *   - the REST endpoints under `/services/bank` that the application's
 *     own pages call (`createAccount`, `transfer`).
 *
 * The registration form needs a session to exist before it is posted to,
 * so the driver fetches the form page first.
 *
 * ZERO ASSERTIONS.
 */
export class ParaBankAppDriver {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
  ) {}

  /**
   * Register a customer.
   *
   * On success ParaBank answers with the "Customer Created" page and
   * authenticates the customer in the same session.
   */
  async register(customer: CustomerPayload): Promise<DriverResponse> {
    // The form is only accepted once the session exists.
    await this.request.get(`${this.baseUrl}/register.htm`);

    const response = await this.request.post(`${this.baseUrl}/register.htm`, {
      form: {
        'customer.firstName': customer.firstName,
        'customer.lastName': customer.lastName,
        'customer.address.street': customer.address,
        'customer.address.city': customer.city,
        'customer.address.state': customer.state,
        'customer.address.zipCode': customer.zipCode,
        'customer.phoneNumber': customer.phone,
        'customer.ssn': customer.ssn,
        'customer.username': customer.username,
        'customer.password': customer.password,
        repeatedPassword: customer.confirm,
      },
    });

    return { status: response.status(), body: await response.text() };
  }

  /** The accounts a customer owns, as the REST endpoint reports them. */
  async accountsOf(customerId: number): Promise<DriverResponse> {
    const response = await this.request.get(
      `${this.baseUrl}/services/bank/customers/${customerId}/accounts`,
      { headers: { Accept: 'application/json' } },
    );
    return { status: response.status(), body: await response.text() };
  }

  /** The transactions of an account, as the REST endpoint reports them. */
  async transactionsOf(accountId: number): Promise<DriverResponse> {
    const response = await this.request.get(
      `${this.baseUrl}/services/bank/accounts/${accountId}/transactions`,
      { headers: { Accept: 'application/json' } },
    );
    return { status: response.status(), body: await response.text() };
  }

  /**
   * Open a new account.
   *
   * This is the call the "Open New Account" page makes: the account
   * type is the numeric code of the page's drop-down.
   */
  async openAccount(
    customerId: number,
    newAccountType: AccountTypeCodeValue | string,
    fromAccountId: number,
  ): Promise<DriverResponse> {
    const response = await this.request.post(
      `${this.baseUrl}/services/bank/createAccount` +
        `?customerId=${customerId}&newAccountType=${newAccountType}&fromAccountId=${fromAccountId}`,
    );
    return { status: response.status(), body: await response.text() };
  }

  /** Move money between two accounts. */
  async transfer(
    fromAccountId: number,
    toAccountId: number,
    amount: string,
  ): Promise<DriverResponse> {
    const response = await this.request.post(
      `${this.baseUrl}/services/bank/transfer` +
        `?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}&amount=${amount}`,
    );
    return { status: response.status(), body: await response.text() };
  }
}
