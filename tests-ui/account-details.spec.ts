import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Account details (PB-1009).
 *
 * The drill-in page a customer reaches by clicking an account number on
 * the accounts overview. It shows the account number, the account type and
 * the two balances.
 *
 * The detail values are rendered by an XHR after the page has loaded, so
 * every assertion here waits for the value it expects instead of pausing
 * for a fixed amount of time.
 *
 * Read-only - the demo customer is never modified.
 */
test.describe('Account details', () => {
  test(
    ticketTitle(Tickets.accountDetails, 'opens the activity page of the account that was clicked'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-account-details')] },
    async ({ overviewPage, page }) => {
      await overviewPage.waitForAccountsToLoad();
      const rows = await overviewPage.getAccountRows();

      await overviewPage.clickAccountByIndex(0);

      await expect(page).toHaveURL(new RegExp(`id=${rows[0].accountNumber}`));
      await expect(page.locator('#rightPanel')).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.accountDetails, 'heads the page with "Account Details"'),
    { tag: [Tags.REGRESSION, featureTag('ui-account-details')] },
    async ({ overviewPage, page }) => {
      await overviewPage.waitForAccountsToLoad();

      await overviewPage.clickAccountByIndex(0);

      await expect(page.locator('#rightPanel h1.title').first()).toHaveText(/Account Details/i);
      await expect(page).toHaveTitle(/ParaBank/);
    },
  );

  test(
    ticketTitle(Tickets.accountDetails, 'shows the account number of the clicked account'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-account-details')] },
    async ({ overviewPage, page }) => {
      await overviewPage.waitForAccountsToLoad();
      const rows = await overviewPage.getAccountRows();

      await overviewPage.clickAccountByIndex(0);

      await expect(page.locator('#accountId')).toHaveText(rows[0].accountNumber);
    },
  );

  test(
    ticketTitle(Tickets.accountDetails, 'shows the type of the clicked account'),
    { tag: [Tags.REGRESSION, featureTag('ui-account-details')] },
    async ({ overviewPage, page }) => {
      await overviewPage.waitForAccountsToLoad();

      await overviewPage.clickAccountByIndex(0);

      await expect(page.locator('#accountType')).toHaveText(/^[A-Z]+$/);
    },
  );

  test(
    ticketTitle(Tickets.accountDetails, 'shows the balance and the available balance of the account'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-account-details')] },
    async ({ overviewPage, page }) => {
      await overviewPage.waitForAccountsToLoad();

      await overviewPage.clickAccountByIndex(0);

      await expect(page.locator('#balance')).toHaveText(/^-?\$\d[\d,]*\.\d{2}$/);
      await expect(page.locator('#availableBalance')).toHaveText(/^-?\$\d[\d,]*\.\d{2}$/);
    },
  );
});
