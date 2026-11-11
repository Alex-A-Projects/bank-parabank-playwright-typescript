/**
 * tests-api/stocks.spec.ts
 *
 * Stock positions (PB-2006).
 *
 * `buyPosition` and `sellPosition` answer with the customer's whole list of
 * positions, so a test reads the list before and after the trade and
 * compares it - that keeps the assertions independent of how many
 * positions earlier runs have left behind.
 *
 * `getPositionHistory` is a special case: ParaBank ships without a price
 * history for the positions it seeds and answers such a request with the
 * fault "Could not find position #<id>". The test therefore accepts both
 * outcomes - a history, or the fault that names the position - and only
 * asserts that the operation is reachable and answers about that very
 * position.
 */
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';

test.describe('ParaBank API - stocks', () => {
  test(
    ticketTitle(Tickets.apiStocks, 'lists the positions of the demo customer'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('api-stocks')] },
    async ({ paraBank, demoSession }) => {
      const result = await paraBank.stocks.list(demoSession.id);

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      const positions = result.data ?? [];
      expect(positions.length).toBeGreaterThan(0);
      for (const position of positions) {
        expect(position.positionId).toBeGreaterThan(0);
        expect(position.customerId).toBe(demoSession.id);
        expect(position.symbol).toBeTruthy();
        expect(position.shares).toBeGreaterThan(0);
        expect(Number.isFinite(position.purchasePrice)).toBe(true);
      }
    },
  );

  test(
    ticketTitle(Tickets.apiStocks, 'reads a single position by id'),
    { tag: [Tags.REGRESSION, featureTag('api-stocks')] },
    async ({ paraBank, demoSession }) => {
      const positions = (await paraBank.stocks.list(demoSession.id)).data ?? [];
      expect(positions.length).toBeGreaterThan(0);
      const wanted = positions[0];

      const result = await paraBank.stocks.get(wanted.positionId);

      expect(result.status).toBe(200);
      expect(result.fault).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.positionId).toBe(wanted.positionId);
      expect(result.data?.customerId).toBe(demoSession.id);
      expect(result.data?.symbol).toBe(wanted.symbol);
      expect(result.data?.shares).toBe(wanted.shares);
      expect(result.data?.purchasePrice).toBeCloseTo(wanted.purchasePrice, 2);
    },
  );

  test(
    ticketTitle(Tickets.apiStocks, 'buys shares and books them as a new position'),
    { tag: [Tags.REGRESSION, featureTag('api-stocks')] },
    async ({ paraBank, demoSession }) => {
      const accounts = (await paraBank.accounts.list(demoSession.id)).data ?? [];
      expect(accounts.length).toBeGreaterThan(0);
      const before = (await paraBank.stocks.list(demoSession.id)).data ?? [];
      const knownIds = before.map((position) => position.positionId);

      const bought = await paraBank.stocks.buy(
        demoSession.id,
        accounts[0].id,
        'Apple Inc',
        'AAPL',
        1,
        '50',
      );

      expect(bought.status).toBe(200);
      expect(bought.fault).toBeNull();
      expect(bought.data).not.toBeNull();

      const after = (await paraBank.stocks.list(demoSession.id)).data ?? [];
      const fresh = after.filter(
        (position) =>
          !knownIds.includes(position.positionId) &&
          position.symbol === 'AAPL' &&
          position.shares === 1 &&
          Math.abs(position.purchasePrice - 50) < 0.01,
      );
      expect(fresh.length).toBeGreaterThan(0);
      expect(fresh[0].customerId).toBe(demoSession.id);
    },
  );

  test(
    ticketTitle(Tickets.apiStocks, 'sells the shares of a position it bought'),
    { tag: [Tags.REGRESSION, featureTag('api-stocks')] },
    async ({ paraBank, demoSession }) => {
      const accounts = (await paraBank.accounts.list(demoSession.id)).data ?? [];
      expect(accounts.length).toBeGreaterThan(0);
      const before = (await paraBank.stocks.list(demoSession.id)).data ?? [];
      const knownIds = before.map((position) => position.positionId);

      const bought = await paraBank.stocks.buy(
        demoSession.id,
        accounts[0].id,
        'Microsoft Corporation',
        'MSFT',
        2,
        '25.50',
      );
      expect(bought.status).toBe(200);
      expect(bought.fault).toBeNull();

      const withNew = (await paraBank.stocks.list(demoSession.id)).data ?? [];
      const fresh = withNew.filter(
        (position) =>
          !knownIds.includes(position.positionId) &&
          position.symbol === 'MSFT' &&
          position.shares === 2 &&
          Math.abs(position.purchasePrice - 25.5) < 0.01,
      );
      expect(fresh.length).toBeGreaterThan(0);
      const positionId = fresh[0].positionId;

      const sold = await paraBank.stocks.sell(
        demoSession.id,
        accounts[0].id,
        positionId,
        2,
        '25.50',
      );

      expect(sold.status).toBe(200);
      expect(sold.fault).toBeNull();
      expect(sold.data).not.toBeNull();

      const after = (await paraBank.stocks.list(demoSession.id)).data ?? [];
      const remaining = after.find((position) => position.positionId === positionId);
      // A position that was sold completely is gone from the list; one
      // that still holds shares has them counted down.
      expect(remaining?.shares ?? 0).toBe(0);
    },
  );

  test(
    ticketTitle(Tickets.apiStocks, 'answers a price-history request for a position'),
    { tag: [Tags.REGRESSION, featureTag('api-stocks')] },
    async ({ paraBank, demoSession }) => {
      const positions = (await paraBank.stocks.list(demoSession.id)).data ?? [];
      expect(positions.length).toBeGreaterThan(0);
      const wanted = positions[0];

      const result = await paraBank.stocks.history(
        wanted.positionId,
        '01-01-2020',
        '12-31-2026',
      );

      if (result.fault !== null) {
        // ParaBank has no price history for the positions it seeds and
        // says so by naming the position it could not find.
        expect(result.fault).toContain(`Could not find position #${wanted.positionId}`);
        expect(result.data).toBeNull();
      } else {
        expect(result.status).toBe(200);
        for (const point of result.data ?? []) {
          expect(point.date).toBeTruthy();
          expect(Number.isFinite(point.closingPrice ?? 0)).toBe(true);
        }
      }
    },
  );
});
