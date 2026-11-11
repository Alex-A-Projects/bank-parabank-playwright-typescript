/**
 * tests-api/auth.spec.ts
 *
 * Login behaviour of the ParaBank API (PB-2001).
 *
 * ParaBank has NO registration operation: an unknown username is answered
 * with "Invalid username and/or password" exactly like a wrong password.
 * The tests below therefore treat the seeded demo customer as the only
 * customer an API-only test can authenticate as.
 *
 * The three transports report a rejected login differently - SOAP answers
 * with a fault (HTTP 500), REST with a plain-text body (HTTP 400) - so the
 * assertions are made on the normalised fault message, never on the status
 * code or the envelope.
 */
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';
import { demoCustomer, randomSuffix } from '../src/shared';

test.describe('ParaBank API - authentication', () => {
  test(
    ticketTitle(Tickets.apiAuth, 'logs the seeded demo customer in and returns their profile'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('api-auth')] },
    async ({ paraBank }) => {
      const result = await paraBank.auth.loginAsDemo();

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBeGreaterThan(0);
      expect(result.data?.firstName).toBeTruthy();
      expect(result.data?.lastName).toBeTruthy();
    },
  );

  test(
    ticketTitle(Tickets.apiAuth, 'returns the same customer the customer endpoint returns'),
    { tag: [Tags.REGRESSION, featureTag('api-auth')] },
    async ({ paraBank, demoSession }) => {
      const login = await paraBank.auth.loginAsDemo();
      const customer = await paraBank.customers.get(demoSession.id);

      expect(login.data).not.toBeNull();
      expect(customer.data).not.toBeNull();
      expect(login.data?.id).toBe(customer.data?.id);
      expect(login.data?.firstName).toBe(customer.data?.firstName);
      expect(login.data?.lastName).toBe(customer.data?.lastName);
    },
  );

  test(
    ticketTitle(Tickets.apiAuth, 'rejects a wrong password with an invalid-credentials fault'),
    { tag: [Tags.NEGATIVE, Tags.SECURITY, featureTag('api-auth')] },
    async ({ paraBank }) => {
      const result = await paraBank.auth.login(demoCustomer.username, 'wrong-password');

      expect(result.data).toBeNull();
      expect(result.fault).not.toBeNull();
      expect(result.fault).toContain('Invalid username and/or password');
    },
  );

  test(
    ticketTitle(Tickets.apiAuth, 'rejects an unknown username instead of creating a customer'),
    { tag: [Tags.NEGATIVE, Tags.SECURITY, featureTag('api-auth')] },
    async ({ paraBank }) => {
      const result = await paraBank.auth.login(`ghost_${randomSuffix()}`, 'whatever');

      expect(result.data).toBeNull();
      expect(result.fault).not.toBeNull();
      expect(result.fault).toContain('Invalid username and/or password');
    },
  );

  test(
    ticketTitle(Tickets.apiAuth, 'rejects a login without a password'),
    { tag: [Tags.NEGATIVE, Tags.BOUNDARY, featureTag('api-auth')] },
    async ({ paraBank }) => {
      const result = await paraBank.auth.login(demoCustomer.username, '');

      // The transports differ in how they frame the refusal (a fault, a
      // 400 body, a 404 for the empty URL segment), so only the outcome
      // is asserted: no customer is handed out.
      expect(result.data).toBeNull();
      expect(result.status).toBeGreaterThanOrEqual(400);
    },
  );
});
