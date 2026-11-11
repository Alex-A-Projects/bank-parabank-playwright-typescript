import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Accounts overview (PB-1008).
 *
 * The page a customer lands on after signing in: the table of the
 * customer's accounts and the post-login menu on the left.
 *
 * Read-only - the demo customer is never modified, so every test uses the
 * `overviewPage` fixture.
 */
test.describe('Accounts overview', () => {
  test(
    ticketTitle(Tickets.accountOverview, 'heads the page with "Accounts Overview"'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-account-overview')] },
    async ({ overviewPage }) => {
      await expect(overviewPage.heading).toContainText(/Accounts Overview/i);
    },
  );

  test(
    ticketTitle(Tickets.accountOverview, 'renders one row per account of the customer'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-account-overview')] },
    async ({ overviewPage }) => {
      await overviewPage.waitForAccountsToLoad();

      await expect(overviewPage.accountsTable).toBeVisible();
      const rows = await overviewPage.getAccountRows();
      expect(rows.length).toBeGreaterThan(0);
      expect(await overviewPage.getAccountRowCount()).toBe(rows.length);
    },
  );

  test(
    ticketTitle(Tickets.accountOverview, 'shows the total balance of every account'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-account-overview')] },
    async ({ overviewPage }) => {
      await overviewPage.waitForAccountsToLoad();

      await expect(overviewPage.totalRow).toBeAttached();
      expect(await overviewPage.getTotalBalance()).toMatch(/^-?\$\d[\d,]*\.\d{2}$/);
    },
  );

  test(
    ticketTitle(Tickets.accountOverview, 'shows a balance for every account row'),
    { tag: [Tags.REGRESSION, featureTag('ui-account-overview')] },
    async ({ overviewPage }) => {
      await overviewPage.waitForAccountsToLoad();

      const rows = await overviewPage.getAccountRows();
      for (const row of rows) {
        expect(row.accountNumber).toMatch(/^\d+$/);
        expect(row.balance).toMatch(/^-?\$\d[\d,]*\.\d{2}$/);
      }
    },
  );

  test(
    ticketTitle(Tickets.accountOverview, 'links every account row to its activity page'),
    { tag: [Tags.REGRESSION, featureTag('ui-account-overview')] },
    async ({ overviewPage }) => {
      await overviewPage.waitForAccountsToLoad();

      const linkCount = await overviewPage.accountNumberLinks.count();
      expect(linkCount).toBeGreaterThan(0);

      for (let index = 0; index < linkCount; index += 1) {
        const href = await overviewPage.accountNumberLinks.nth(index).getAttribute('href');
        expect(href).toMatch(/activity\.htm\?id=\d+/);
      }
    },
  );

  test(
    ticketTitle(Tickets.accountOverview, 'offers every post-login tab in the left menu'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-account-overview')] },
    async ({ overviewPage }) => {
      await expect(overviewPage.menuOpenAccount).toBeVisible();
      await expect(overviewPage.menuAccountOverview).toBeVisible();
      await expect(overviewPage.menuTransferFunds).toBeVisible();
      await expect(overviewPage.menuBillPay).toBeVisible();
      await expect(overviewPage.menuFindTransactions).toBeVisible();
      await expect(overviewPage.menuUpdateContactInfo).toBeVisible();
      await expect(overviewPage.menuRequestLoan).toBeVisible();
      await expect(overviewPage.menuLogOut).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.accountOverview, 'reaches every post-login tab through the left menu'),
    { tag: [Tags.E2E, Tags.REGRESSION, featureTag('ui-account-overview')] },
    async ({ overviewPage, page }) => {
      await overviewPage.menuOpenAccount.click();
      await expect(page).toHaveURL(/openaccount\.htm/);

      await overviewPage.menuTransferFunds.click();
      await expect(page).toHaveURL(/transfer\.htm/);

      await overviewPage.menuBillPay.click();
      await expect(page).toHaveURL(/billpay\.htm/);

      await overviewPage.menuFindTransactions.click();
      await expect(page).toHaveURL(/findtrans\.htm/);

      await overviewPage.menuUpdateContactInfo.click();
      await expect(page).toHaveURL(/updateprofile\.htm/);

      await overviewPage.menuRequestLoan.click();
      await expect(page).toHaveURL(/requestloan\.htm/);

      await overviewPage.menuAccountOverview.click();
      await expect(page).toHaveURL(/overview\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.accountOverview, 'drills into the details of the account that was clicked'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-account-overview')] },
    async ({ overviewPage, page }) => {
      await overviewPage.waitForAccountsToLoad();

      await overviewPage.clickAccountByIndex(0);

      await expect(page).toHaveURL(/activity\.htm/);
      await expect(page.locator('#rightPanel')).toBeVisible();
    },
  );
});
