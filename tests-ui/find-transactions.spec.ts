import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Find Transactions (PB-1013).
 *
 * The page behind "Find Transactions" in the post-login menu. It offers four
 * searches - by transaction id, by exact date, by date range and by amount
 * - and renders the matches in a table whose columns are
 * `Date | Transaction | Debit (-) | Credit (+)`.
 *
 * The search form is hidden once a search has run, so every search starts
 * from a freshly opened page.
 *
 * The form-rendering test is read-only and runs against the seeded demo
 * customer. The searches register their own customer, because the number of
 * transactions the shared demo customer owns changes whenever the demo
 * data is re-seeded.
 */
test.describe('Find Transactions', () => {
  test(
    ticketTitle(Tickets.findTransactions, 'offers all four search modes for the account'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-find-transactions')] },
    async ({ overviewPage, findTransactionsPage }) => {
      await overviewPage.menuFindTransactions.click();

      await expect(findTransactionsPage.heading).toContainText(/Find Transactions/i);
      await expect(findTransactionsPage.findByIdButton).toBeVisible();
      await expect(findTransactionsPage.findByDateButton).toBeVisible();
      await expect(findTransactionsPage.findByDateRangeButton).toBeVisible();
      await expect(findTransactionsPage.findByAmountButton).toBeVisible();

      await findTransactionsPage.waitForAccountsDropToPopulate();
      expect(await findTransactionsPage.accountDropdown.locator('option').count()).toBeGreaterThan(0);
    },
  );

  test(
    ticketTitle(Tickets.findTransactions, 'returns an empty result set when no amount matches'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-find-transactions')] },
    async ({ registeredCustomer, accountOverviewPage, findTransactionsPage }) => {
      await accountOverviewPage.menuAccountOverview.waitFor({ state: 'visible' });

      await findTransactionsPage.open();
      await findTransactionsPage.waitForAccountsDropToPopulate();
      const [accountId] = await findTransactionsPage.accountDropdown.locator('option').evaluateAll(
        (nodes) => nodes.map((node) => (node as HTMLOptionElement).value).filter(Boolean),
      );
      if (!accountId) {
        throw new Error('The registered customer has no account to search.');
      }

      await findTransactionsPage.searchByAmount({ fromId: accountId, amount: '0.01' });
      await findTransactionsPage.waitForResults();

      await expect(findTransactionsPage.resultsTable).toBeAttached();
      expect(await findTransactionsPage.getResultRowCount()).toBe(0);
    },
  );

  test(
    ticketTitle(Tickets.findTransactions, 'lists the transactions of the selected account for a date range'),
    { tag: [Tags.MUTATING, Tags.SMOKE, Tags.REGRESSION, featureTag('ui-find-transactions')] },
    async ({ registeredCustomer, accountOverviewPage, accountService, findTransactionsPage }) => {
      await accountOverviewPage.menuAccountOverview.waitFor({ state: 'visible' });

      // Opening a savings account moves the opening balance out of the
      // checking account, which gives that account a transaction to find.
      await accountService.openAccount('SAVINGS');

      await findTransactionsPage.open();
      await findTransactionsPage.waitForAccountsDropToPopulate();
      const [accountId] = await findTransactionsPage.accountDropdown.locator('option').evaluateAll(
        (nodes) => nodes.map((node) => (node as HTMLOptionElement).value).filter(Boolean),
      );
      if (!accountId) {
        throw new Error('The registered customer has no account to search.');
      }

      await findTransactionsPage.searchByDateRange({
        fromId: accountId,
        from: '01-01-2020',
        to: '12-31-2030',
      });
      await findTransactionsPage.waitForResults();

      const rows = await findTransactionsPage.getResultRows();
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.id).toMatch(/^\d+$/);
        expect(row.description).toMatch(/Funds Transfer/i);
      }

      // The table columns are Date | Transaction | Debit (-) | Credit (+), so
      // the amount sits in the debit cell for an outgoing transaction and in
      // the credit cell for an incoming one.
      const cells = findTransactionsPage.resultsBody.locator('tr').first().locator('td');
      await expect(cells.nth(0)).toHaveText(/^\d{2}-\d{2}-\d{4}$/);
      const debit = ((await cells.nth(2).textContent()) ?? '').trim();
      const credit = ((await cells.nth(3).textContent()) ?? '').trim();
      expect(`${debit}${credit}`).toMatch(/\$\d[\d,]*\.\d{2}/);
    },
  );
});
