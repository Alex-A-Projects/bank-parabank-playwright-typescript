/**
 * tests-api/customer.spec.ts
 *
 * Customer reads and the customer update (PB-2002).
 *
 * `updateCustomer` replaces the whole record - the WSDL types it as a full
 * replacement, so username and password have to be sent as well. The test
 * therefore reads the profile first, changes exactly one field and puts the
 * original values back, so the shared demo customer survives the run.
 */
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';
import { demoCustomer } from '../src/shared';

test.describe('ParaBank API - customers', () => {
  test(
    ticketTitle(Tickets.apiCustomer, 'reads the seeded customer by id'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('api-customer')] },
    async ({ paraBank, demoSession }) => {
      const result = await paraBank.customers.get(demoSession.id);

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBe(demoSession.id);
      expect(result.data?.firstName).toBeTruthy();
      expect(result.data?.lastName).toBeTruthy();
      expect(result.data?.ssn).toBeTruthy();
      expect(result.data?.address?.city).toBeTruthy();
    },
  );

  test(
    ticketTitle(Tickets.apiCustomer, 'reports a fault for a customer that does not exist'),
    { tag: [Tags.NEGATIVE, featureTag('api-customer')] },
    async ({ paraBank }) => {
      const result = await paraBank.customers.get(99_999_999);

      expect(result.data).toBeNull();
      expect(result.fault).not.toBeNull();
      expect(result.fault).toContain('Could not find customer');
    },
  );

  test(
    ticketTitle(Tickets.apiCustomer, 'replaces the customer profile and restores it afterwards'),
    { tag: [Tags.REGRESSION, featureTag('api-customer')] },
    async ({ paraBank, demoSession }) => {
      const before = await paraBank.customers.get(demoSession.id);
      expect(before.data).not.toBeNull();
      expect(before.data?.firstName).toBeTruthy();
      expect(before.data?.ssn).toBeTruthy();

      const original = {
        firstName: before.data?.firstName ?? '',
        lastName: before.data?.lastName ?? '',
        street: before.data?.address?.street ?? '',
        city: before.data?.address?.city ?? '',
        state: before.data?.address?.state ?? '',
        zipCode: before.data?.address?.zipCode ?? '',
        phoneNumber: before.data?.phoneNumber ?? '',
        ssn: before.data?.ssn ?? '',
        username: demoCustomer.username,
        password: demoCustomer.password,
      };
      const changedPhone = '555-867-5309';

      try {
        const updated = await paraBank.customers.update(demoSession.id, {
          ...original,
          phoneNumber: changedPhone,
        });

        expect(updated.status).toBe(200);
        expect(updated.fault).toBeNull();

        const after = await paraBank.customers.get(demoSession.id);
        expect(after.data?.phoneNumber).toBe(changedPhone);
      } finally {
        // The demo customer is shared with the rest of the suite, so the
        // original profile is put back whatever the assertions did.
        await paraBank.customers.update(demoSession.id, original);
      }

      const restored = await paraBank.customers.get(demoSession.id);
      expect(restored.data?.phoneNumber).toBe(original.phoneNumber);
    },
  );
});
