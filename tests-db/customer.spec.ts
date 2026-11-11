/**
 * tests-db/customer.spec.ts
 *
 * The CUSTOMER table (PB-3001).
 *
 * The database suite writes the way the application writes: the customer
 * is registered through the real registration form and the row is read
 * back over JDBC. Nothing here inserts into the table directly - that
 * would prove nothing about the application.
 *
 * Every test registers its own customer with a unique username, so the
 * tests are independent of each other and of the order they run in.
 *
 * The social security number is deliberately not asserted: the JDBC
 * helper selects the CUSTOMER row without the SSN column, so the suite
 * has no evidence about how the application stores it.
 */
import {
  test,
  expect,
  Tags,
  featureTag,
  ticketTitle,
  Tickets,
  customerFactory,
} from '../src/db/fixtures';

test.describe('ParaBank database - customer', () => {
  test(
    ticketTitle(Tickets.dbCustomer, 'writes the submitted registration into the CUSTOMER row'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('db-customer')] },
    async ({ registeredCustomer, customerRepository }) => {
      const { customer, payload } = registeredCustomer;

      expect(customer.username).toBe(payload.username);
      expect(customer.firstName).toBe(payload.firstName);
      expect(customer.lastName).toBe(payload.lastName);
      expect(customer.address).toBe(payload.address);
      expect(customer.city).toBe(payload.city);
      expect(customer.state).toBe(payload.state);
      expect(customer.zipCode).toBe(payload.zipCode);
      expect(customer.phoneNumber).toBe(payload.phone);
    },
  );

  test(
    ticketTitle(Tickets.dbCustomer, 'gives the customer an id that resolves to the same row'),
    { tag: [Tags.REGRESSION, featureTag('db-customer')] },
    async ({ registeredCustomer, customerRepository }) => {
      const byId = await customerRepository.findById(registeredCustomer.customer.id);
      const byUsername = await customerRepository.findByUsername(registeredCustomer.username);

      expect(byId).not.toBeNull();
      expect(byUsername).not.toBeNull();
      expect(byId).toEqual(byUsername);
    },
  );

  test(
    ticketTitle(Tickets.dbCustomer, 'increases the customer count by exactly one'),
    { tag: [Tags.REGRESSION, featureTag('db-customer')] },
    async ({ appDriver, customerRepository }) => {
      const before = await customerRepository.count();
      const payload = customerFactory.build();

      const response = await appDriver.register(payload);

      expect(response.body).toContain('Customer Created');
      expect(await customerRepository.count()).toBe(before + 1);
    },
  );

  test(
    ticketTitle(Tickets.dbCustomer, 'stores no row for a username that was never registered'),
    { tag: [Tags.NEGATIVE, featureTag('db-customer')] },
    async ({ customerRepository }) => {
      // A freshly generated username was never sent to the application.
      const unused = customerFactory.build().username;

      expect(await customerRepository.findByUsername(unused)).toBeNull();
      expect(await customerRepository.existsByUsername(unused)).toBe(false);
    },
  );

  test(
    ticketTitle(Tickets.dbCustomer, 'stores every registration on a row of its own'),
    { tag: [Tags.REGRESSION, featureTag('db-customer')] },
    async ({ appDriver, customerRepository }) => {
      const first = customerFactory.build();
      const second = customerFactory.build();

      const firstResponse = await appDriver.register(first);
      const secondResponse = await appDriver.register(second);

      expect(firstResponse.body).toContain('Customer Created');
      expect(secondResponse.body).toContain('Customer Created');

      const firstRow = await customerRepository.findByUsername(first.username);
      const secondRow = await customerRepository.findByUsername(second.username);

      expect(firstRow?.id).toBeGreaterThan(0);
      expect(secondRow?.id).toBeGreaterThan(0);
      expect(firstRow?.id).not.toBe(secondRow?.id);
    },
  );

  test(
    ticketTitle(Tickets.dbCustomer, 'keeps the customer row readable under its username'),
    { tag: [Tags.SANITY, featureTag('db-customer')] },
    async ({ registeredCustomer, customerRepository }) => {
      const first = await customerRepository.findByUsername(registeredCustomer.username);
      const second = await customerRepository.findByUsername(registeredCustomer.username);

      expect(first).not.toBeNull();
      expect(second).toEqual(first);
    },
  );
});
