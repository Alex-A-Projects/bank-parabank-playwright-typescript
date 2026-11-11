import { demoCustomer } from '../../shared/env';
import type { ApiResult } from '../models/api-result.model';
import type { Customer } from '../models/customer.model';
import type { ParaBankStrategy } from '../strategies/parabank-strategy';

/**
 * Authentication operations.
 *
 * ZERO ASSERTIONS. The service reports what the server answered; the
 * test layer decides whether the answer is the expected one.
 */
export class AuthService {
  constructor(private readonly strategy: ParaBankStrategy) {}

  /**
   * Log in with an explicit username and password.
   *
   * ParaBank does NOT create a customer on the fly: an unknown username
   * is answered with "Invalid username and/or password". A customer has
   * to exist first (the UI's registration form is the only way to
   * create one).
   */
  async login(username: string, password: string): Promise<ApiResult<Customer>> {
    return await this.strategy.login(username, password);
  }

  /** Log in with the seeded demo customer. */
  async loginAsDemo(): Promise<ApiResult<Customer>> {
    return await this.strategy.login(demoCustomer.username, demoCustomer.password);
  }

  /** The customer id carried by a successful login, or `null`. */
  customerIdOf(result: ApiResult<Customer>): number | null {
    return result.data ? result.data.id : null;
  }
}
