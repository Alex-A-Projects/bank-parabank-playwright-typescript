/**
 * tests-api/transaction.spec.ts
 *
 * Transaction reads (PB-2004).
 *
 * Two ParaBank quirks shape these tests:
 *
 *   - the date filters expect ParaBank's own `MM-dd-yyyy` format, not ISO.
 *     A `2025-12-11` filter matches nothing; a `12-11-2025` filter matches
 *     the transactions booked that day;
 *   - the month filter of `getTransactionsByMonthAndType` is accepted but
 *     not applied by the service - only the type narrows the result. The
 *     tests therefore assert on the type and let the month follow the
 *     transaction they started from.
 *
 * No account id is hard-coded: the first account of the demo customer that
 * carries transactions is looked up through the API.
 */
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';
import { formatParaBankDate } from '../src/shared';

/** An ISO date (`YYYY-MM-DD`) in the format ParaBank's filters expect. */
function paraBankDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return formatParaBankDate(new Date(year, month - 1, day));
}

test.describe('ParaBank API - transactions', () => {
  let accountId = 0;

  test.beforeEach(async ({ paraBank, demoSession }) => {
    const accounts = (await paraBank.accounts.list(demoSession.id)).data ?? [];
    for (const account of accounts) {
      const probe = await paraBank.transactions.list(account.id);
      if (probe.data !== null && probe.data.length > 0) {
        accountId = account.id;
        break;
      }
    }
    expect(accountId).toBeGreaterThan(0);
  });

  test(
    ticketTitle(Tickets.apiTransaction, 'lists every transaction of an account'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('api-transaction')] },
    async ({ paraBank }) => {
      const result = await paraBank.transactions.list(accountId);

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      const transactions = result.data ?? [];
      expect(transactions.length).toBeGreaterThan(0);
      for (const transaction of transactions) {
        expect(transaction.id).toBeGreaterThan(0);
        expect(transaction.accountId).toBe(accountId);
        expect(Number.isFinite(transaction.amount)).toBe(true);
        expect(transaction.date).toBeTruthy();
        expect(['Credit', 'Debit']).toContain(transaction.type);
      }
    },
  );

  test(
    ticketTitle(Tickets.apiTransaction, 'reads a single transaction by id'),
    { tag: [Tags.REGRESSION, featureTag('api-transaction')] },
    async ({ paraBank }) => {
      const transactions = (await paraBank.transactions.list(accountId)).data ?? [];
      expect(transactions.length).toBeGreaterThan(0);
      const wanted = transactions[0];

      const result = await paraBank.transactions.get(wanted.id);

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBe(wanted.id);
      expect(result.data?.accountId).toBe(wanted.accountId);
      expect(result.data?.amount).toBe(wanted.amount);
      expect(result.data?.date).toBe(wanted.date);
    },
  );

  test(
    ticketTitle(Tickets.apiTransaction, 'reports a fault for a transaction that does not exist'),
    { tag: [Tags.NEGATIVE, featureTag('api-transaction')] },
    async ({ paraBank }) => {
      const result = await paraBank.transactions.get(99_999_999);

      expect(result.data).toBeNull();
      expect(result.fault).not.toBeNull();
      expect(result.fault).toContain('Could not find transaction');
    },
  );

  test(
    ticketTitle(Tickets.apiTransaction, 'returns only the transactions that carry the given amount'),
    { tag: [Tags.REGRESSION, featureTag('api-transaction')] },
    async ({ paraBank }) => {
      const transactions = (await paraBank.transactions.list(accountId)).data ?? [];
      const wanted = transactions.find((transaction) => transaction.amount > 0);
      expect(wanted).toBeDefined();

      const result = await paraBank.transactions.findByAmount(
        accountId,
        String(wanted?.amount ?? 0),
      );

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      const matches = result.data ?? [];
      expect(matches.length).toBeGreaterThan(0);
      for (const match of matches) {
        expect(match.accountId).toBe(accountId);
        expect(match.amount).toBeCloseTo(wanted?.amount ?? 0, 2);
      }
    },
  );

  test(
    ticketTitle(Tickets.apiTransaction, 'returns the transactions booked on a given day'),
    { tag: [Tags.REGRESSION, featureTag('api-transaction')] },
    async ({ paraBank }) => {
      const transactions = (await paraBank.transactions.list(accountId)).data ?? [];
      const wanted = transactions[0];
      const isoDate = wanted.date.slice(0, 10);

      const result = await paraBank.transactions.findOnDate(accountId, paraBankDate(isoDate));

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      const matches = result.data ?? [];
      expect(matches.length).toBeGreaterThan(0);
      for (const match of matches) {
        expect(match.accountId).toBe(accountId);
        expect(match.date.slice(0, 10)).toBe(isoDate);
      }
    },
  );

  test(
    ticketTitle(Tickets.apiTransaction, 'returns the transactions booked inside a date range'),
    { tag: [Tags.REGRESSION, featureTag('api-transaction')] },
    async ({ paraBank }) => {
      const transactions = (await paraBank.transactions.list(accountId)).data ?? [];
      const days = transactions.map((transaction) => transaction.date.slice(0, 10)).sort();
      const from = days[0];
      const to = days[days.length - 1];

      const result = await paraBank.transactions.findInRange(
        accountId,
        paraBankDate(from),
        paraBankDate(to),
      );

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      const matches = result.data ?? [];
      expect(matches.length).toBeGreaterThan(0);
      for (const match of matches) {
        const day = match.date.slice(0, 10);
        expect(day >= from).toBe(true);
        expect(day <= to).toBe(true);
      }
    },
  );

  test(
    ticketTitle(Tickets.apiTransaction, 'returns the transactions of a month that carry a given type'),
    { tag: [Tags.REGRESSION, featureTag('api-transaction')] },
    async ({ paraBank }) => {
      const transactions = (await paraBank.transactions.list(accountId)).data ?? [];
      const wanted = transactions.find((transaction) => transaction.type === 'Credit') ?? transactions[0];
      const type = wanted.type;
      const month = paraBankDate(wanted.date.slice(0, 10)).slice(0, 2);

      const result = await paraBank.transactions.findByMonthAndType(accountId, month, type);

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      const matches = result.data ?? [];
      expect(matches.length).toBeGreaterThan(0);
      for (const match of matches) {
        expect(match.type).toBe(type);
      }
      expect(matches.some((match) => match.id === wanted.id)).toBe(true);
    },
  );
});
