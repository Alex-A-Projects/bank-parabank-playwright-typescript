/**
 * tests-api/account.spec.ts
 *
 * Account reads and account opening (PB-2003).
 *
 * The account type is spoken in two spellings: ParaBank *stores* the
 * numeric code (0 = CHECKING, 1 = SAVINGS, 2 = LOAN) and *answers* with
 * the name. `AccountTypeCode` is what a caller sends, `AccountTypeNames`
 * is what comes back.
 *
 * No account id is hard-coded: the demo customer's accounts are read from
 * the API first, so the tests hold on a freshly seeded instance as well as
 * on one that earlier runs have added accounts to.
 */
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';
import { AccountTypeCode, AccountTypeNames } from '../src/shared';

test.describe('ParaBank API - accounts', () => {
  test(
    ticketTitle(Tickets.apiAccount, 'lists every account of the demo customer'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('api-account')] },
    async ({ paraBank, demoSession }) => {
      const result = await paraBank.accounts.list(demoSession.id);

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      const accounts = result.data ?? [];
      expect(accounts.length).toBeGreaterThan(1);
      for (const account of accounts) {
        expect(account.id).toBeGreaterThan(0);
        expect(account.customerId).toBe(demoSession.id);
        expect(account.type).toBeTruthy();
        expect(Number.isFinite(account.balance)).toBe(true);
      }
    },
  );

  test(
    ticketTitle(Tickets.apiAccount, 'reads a single account by id'),
    { tag: [Tags.REGRESSION, featureTag('api-account')] },
    async ({ paraBank, demoSession }) => {
      const accounts = (await paraBank.accounts.list(demoSession.id)).data ?? [];
      expect(accounts.length).toBeGreaterThan(0);
      const wanted = accounts[0];

      const result = await paraBank.accounts.get(wanted.id);

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBe(wanted.id);
      expect(result.data?.customerId).toBe(demoSession.id);
      expect(result.data?.type).toBe(wanted.type);
      expect(result.data?.balance).toBe(wanted.balance);
    },
  );

  test(
    ticketTitle(Tickets.apiAccount, 'reports a fault for an account that does not exist'),
    { tag: [Tags.NEGATIVE, featureTag('api-account')] },
    async ({ paraBank }) => {
      const result = await paraBank.accounts.get(99_999_999);

      expect(result.data).toBeNull();
      expect(result.fault).not.toBeNull();
      expect(result.fault).toContain('Could not find account');
    },
  );

  test(
    ticketTitle(Tickets.apiAccount, 'opens a savings account for the demo customer'),
    { tag: [Tags.REGRESSION, featureTag('api-account')] },
    async ({ paraBank, demoSession }) => {
      const accounts = (await paraBank.accounts.list(demoSession.id)).data ?? [];
      expect(accounts.length).toBeGreaterThan(0);
      const fundedFrom = accounts[0];

      const result = await paraBank.accounts.open(
        demoSession.id,
        AccountTypeCode.SAVINGS,
        fundedFrom.id,
      );

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBeGreaterThan(0);
      expect(result.data?.customerId).toBe(demoSession.id);
      expect(result.data?.type).toBe(AccountTypeNames.SAVINGS);

      const after = (await paraBank.accounts.list(demoSession.id)).data ?? [];
      expect(after.some((account) => account.id === result.data?.id)).toBe(true);
    },
  );
});
