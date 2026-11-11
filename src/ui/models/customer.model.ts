/**
 * Customer-shaped models for the UI suite.
 *
 * These are plain data shapes — no behaviour, no assertions. They exist so
 * that services and fixtures can pass a customer around without importing
 * a Page Object.
 */

/** A customer that only needs credentials. */
export interface Customer {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

/** The full registration payload ParaBank's register form expects. */
export interface NewCustomer {
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

/** The editable slice of a customer profile (update-profile form). */
export interface ContactProfile {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}
