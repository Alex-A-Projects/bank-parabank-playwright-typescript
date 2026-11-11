/**
 * A row of ParaBank's `CUSTOMER` table.
 *
 * The column list mirrors the table as ParaBank creates it - the same
 * columns the SQL helper selects.
 */
export interface DbCustomer {
  /** `CUSTOMER.ID` */
  id: number;
  /** `CUSTOMER.FIRST_NAME` */
  firstName: string;
  /** `CUSTOMER.LAST_NAME` */
  lastName: string;
  /** `CUSTOMER.ADDRESS` */
  address: string;
  /** `CUSTOMER.CITY` */
  city: string;
  /** `CUSTOMER.STATE` */
  state: string;
  /** `CUSTOMER.ZIP_CODE` */
  zipCode: string;
  /** `CUSTOMER.PHONE_NUMBER` */
  phoneNumber: string;
  /** `CUSTOMER.USERNAME` */
  username: string;
}
