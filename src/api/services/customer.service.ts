import type { ApiResult } from '../models/api-result.model';
import type { Customer } from '../models/customer.model';
import type { ParaBankStrategy } from '../strategies/parabank-strategy';
import type { CustomerUpdate } from '../strategies/parabank-strategy';

/**
 * Customer operations.
 *
 * ZERO ASSERTIONS.
 */
export class CustomerService {
  constructor(private readonly strategy: ParaBankStrategy) {}

  /** Read a customer by id. */
  async get(customerId: number): Promise<ApiResult<Customer>> {
    return await this.strategy.getCustomer(customerId);
  }

  /**
   * Replace a customer's profile.
   *
   * The WSDL types `updateCustomer` as a full replacement, so every
   * field - including the username and password - has to be supplied.
   */
  async update(customerId: number, fields: CustomerUpdate): Promise<ApiResult<string>> {
    return await this.strategy.updateCustomer(customerId, fields);
  }
}
