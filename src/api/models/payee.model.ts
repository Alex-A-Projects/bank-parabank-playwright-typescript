/**
 * The payee a bill payment is made to.
 *
 * Mirrors the WSDL's `payee` type, which the `billPay` operation takes
 * as its third (unnamed) argument.
 */
export interface PayeeAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/** A bill-payment payee. */
export interface Payee {
  /** The account number the payment is drawn from. */
  accountNumber?: number;
  /** The payee's postal address. */
  address?: PayeeAddress;
  /** The payee's name. */
  name?: string;
  /** The payee's phone number. */
  phoneNumber?: string;
}
