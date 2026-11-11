import { randomCity, randomPhone, randomSsn, randomState, randomStreet, randomZip, uniqueUsername } from '../generators';

/**
 * Customer factory + builder.
 *
 * Two design patterns, both required by the framework brief:
 *
 *   - **Factory** — `customerFactory.build()` produces a complete, valid
 *     registration payload with random-but-plausible data. The factory
 *     owns the defaults so no test has to invent a customer.
 *   - **Builder** — `CustomerBuilder` lets a caller override one field at
 *     a time (for a negative test that needs a specific wrong value)
 *     without having to restate the other ten.
 *
 * The factory deliberately keeps usernames short: ParaBank silently
 * truncates usernames at roughly 20 characters, so a long generated
 * username would collide with the next run's username and fail with a
 * confusing "user already exists" error.
 */

/** The full registration payload. Mirrors the shape every suite needs. */
export interface CustomerPayload {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  username: string;
  password: string;
  confirm: string;
}

/**
 * Fluent builder for a customer registration payload.
 *
 * @example
 * new CustomerBuilder()
 *   .withUsername('qa_fixed_user')
 *   .withPassword('Short1')
 *   .build();
 */
export class CustomerBuilder {
  private readonly payload: CustomerPayload;

  constructor(seed?: Partial<CustomerPayload>) {
    this.payload = {
      firstName: 'Auto',
      lastName: 'Tester',
      address: randomStreet(),
      city: randomCity(),
      state: randomState(),
      zipCode: randomZip(),
      phone: randomPhone(),
      ssn: randomSsn(),
      username: uniqueUsername(),
      password: 'Passw0rd!',
      confirm: 'Passw0rd!',
      ...seed,
    };
  }

  withFirstName(value: string): this {
    this.payload.firstName = value;
    return this;
  }

  withLastName(value: string): this {
    this.payload.lastName = value;
    return this;
  }

  withAddress(value: string): this {
    this.payload.address = value;
    return this;
  }

  withCity(value: string): this {
    this.payload.city = value;
    return this;
  }

  withState(value: string): this {
    this.payload.state = value;
    return this;
  }

  withZipCode(value: string): this {
    this.payload.zipCode = value;
    return this;
  }

  withPhone(value: string): this {
    this.payload.phone = value;
    return this;
  }

  withSsn(value: string): this {
    this.payload.ssn = value;
    return this;
  }

  withUsername(value: string): this {
    this.payload.username = value;
    return this;
  }

  withPassword(value: string): this {
    this.payload.password = value;
    // Keep the confirmation in step with the password unless the caller
    // overrides it explicitly afterwards.
    this.payload.confirm = value;
    return this;
  }

  /** Set the confirmation field independently (negative tests). */
  withPasswordConfirmation(value: string): this {
    this.payload.confirm = value;
    return this;
  }

  /** The completed payload. */
  build(): CustomerPayload {
    return { ...this.payload };
  }
}

/**
 * The customer factory.
 *
 * `build()` returns a fresh random customer; `buildWith(seed)` applies a
 * partial override on top of the random defaults.
 */
export const customerFactory = {
  build(): CustomerPayload {
    return new CustomerBuilder().build();
  },

  buildWith(seed: Partial<CustomerPayload>): CustomerPayload {
    return new CustomerBuilder(seed).build();
  },
};
