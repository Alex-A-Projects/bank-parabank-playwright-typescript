/**
 * Customer-shaped DTOs for the API suite.
 *
 * These mirror ParaBank's `customer` type from the published WSDL and
 * WADL. Every field is optional in the wire format (ParaBank omits empty
 * values), so the parsed models keep them optional and the test layer
 * decides what it requires.
 */

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Customer {
  id: number;
  firstName?: string;
  lastName?: string;
  address?: Address;
  phoneNumber?: string;
  ssn?: string;
}
