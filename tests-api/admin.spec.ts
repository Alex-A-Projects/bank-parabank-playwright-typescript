/**
 * tests-api/admin.spec.ts
 *
 * Server administration: JMS listeners (PB-2007) and the database
 * lifecycle (PB-2008).
 *
 * The two feature areas live in one file because they share the same
 * service, but they are gated separately: `api-jms` runs everywhere,
 * `api-db-lifecycle` only against the local instance, because wiping the
 * database of the shared public demo would hurt every other user of it.
 *
 * The transports report the same operation differently - the REST routes
 * answer 204 No Content, SOAP answers 200 with an empty response element -
 * so the assertions here are made on the status range and never on the
 * exact code or on the envelope.
 */
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';
import { demoCustomer, randomSuffix } from '../src/shared';

/** True for a status the transports use to say "the call went through". */
function isSuccessful(status: number): boolean {
  return status >= 200 && status < 300;
}

test.describe('ParaBank API - JMS listeners', () => {
  test(
    ticketTitle(Tickets.apiJms, 'starts the JMS listener'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('api-jms')] },
    async ({ paraBank }) => {
      const result = await paraBank.admin.startupJmsListener();

      expect(isSuccessful(result.status)).toBe(true);
      expect(result.fault).toBeNull();
    },
  );

  test(
    ticketTitle(Tickets.apiJms, 'stops the JMS listener'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('api-jms')] },
    async ({ paraBank }) => {
      // The listener is running on a freshly started instance, and the
      // UI suite's administration test asserts that. Start it first, so
      // this test does not depend on the one before it, and put it back
      // afterwards, so the next suite finds the instance the way it was
      // found.
      const started = await paraBank.admin.startupJmsListener();
      expect(isSuccessful(started.status)).toBe(true);

      try {
        const result = await paraBank.admin.shutdownJmsListener();

        expect(isSuccessful(result.status)).toBe(true);
        expect(result.fault).toBeNull();
      } finally {
        const restored = await paraBank.admin.startupJmsListener();
        expect(isSuccessful(restored.status)).toBe(true);
      }
    },
  );
});

test.describe('ParaBank API - database lifecycle', () => {
  test(
    ticketTitle(Tickets.apiDbLifecycle, 'sets a server parameter'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('api-db-lifecycle')] },
    async ({ paraBank }) => {
      const result = await paraBank.admin.setParameter(
        `test-key-${randomSuffix()}`,
        `value-${randomSuffix()}`,
      );

      expect(isSuccessful(result.status)).toBe(true);
      expect(result.fault).toBeNull();
    },
  );

  test(
    ticketTitle(Tickets.apiDbLifecycle, 'resets the database to its seeded state'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('api-db-lifecycle')] },
    async ({ paraBank }) => {
      const result = await paraBank.admin.initializeDb();

      expect(isSuccessful(result.status)).toBe(true);
      expect(result.fault).toBeNull();

      const login = await paraBank.auth.login(demoCustomer.username, demoCustomer.password);
      expect(login.status).toBe(200);
      expect(login.fault).toBeNull();
      expect(login.data).not.toBeNull();
      expect(login.data?.id).toBeGreaterThan(0);
    },
  );

  test(
    ticketTitle(Tickets.apiDbLifecycle, 'empties the database and puts the seed back'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('api-db-lifecycle')] },
    async ({ paraBank, demoSession }) => {
      // The test writes a transaction of its own, so that the wipe can be
      // observed on data it knows is there.
      const accounts = (await paraBank.accounts.list(demoSession.id)).data ?? [];
      expect(accounts.length).toBeGreaterThan(0);
      const account = accounts[0];
      const deposited = await paraBank.money.deposit(account.id, '5');
      expect(deposited.status).toBe(200);
      expect(deposited.fault).toBeNull();
      const before = (await paraBank.transactions.list(account.id)).data ?? [];
      expect(before.length).toBeGreaterThan(0);

      const cleaned = await paraBank.admin.cleanDb();

      expect(isSuccessful(cleaned.status)).toBe(true);
      expect(cleaned.fault).toBeNull();

      try {
        // ParaBank keeps the demo customer but wipes its data: the accounts
        // that are left carry no transactions any more.
        const after = (await paraBank.accounts.list(demoSession.id)).data ?? [];
        expect(after.length).toBeGreaterThan(0);
        for (const remaining of after) {
          const transactions = (await paraBank.transactions.list(remaining.id)).data ?? [];
          expect(transactions.length).toBe(0);
        }
      } finally {
        // The database is seeded again whatever the assertions did, so the
        // rest of the suite still finds the demo customer.
        const restored = await paraBank.admin.initializeDb();
        expect(isSuccessful(restored.status)).toBe(true);
        expect(restored.fault).toBeNull();
      }

      const seeded = (await paraBank.accounts.list(demoSession.id)).data ?? [];
      expect(seeded.length).toBeGreaterThan(1);
      const transactions = await Promise.all(
        seeded.map((seededAccount) => paraBank.transactions.list(seededAccount.id)),
      );
      expect(transactions.some((result) => (result.data ?? []).length > 0)).toBe(true);
    },
  );
});
