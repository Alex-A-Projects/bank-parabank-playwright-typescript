import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Transfer Funds (PB-1011).
 *
 * The form behind "Transfer Funds" in the post-login menu. Money can only
 * be moved between two accounts the customer owns, so the transfer test
 * registers its own customer and opens a second account first.
 *
 * The form-rendering and navigation tests are read-only and run against the
 * seeded demo customer.
 */
test.describe('Transfer Funds', () => {
  test(
    ticketTitle(Tickets.transferFunds, 'offers the customer accounts as source and destination'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-transfer-funds')] },
    async ({ overviewPage, transferFundsPage }) => {
      await overviewPage.menuTransferFunds.click();

      await expect(transferFundsPage.heading).toContainText(/Transfer Funds/i);
      await transferFundsPage.waitForAccountsDropToPopulate();

      const sourceIds = await transferFundsPage.getFromAccountIds();
      const destinationIds = await transferFundsPage.getToAccountIds();
      expect(sourceIds.length).toBeGreaterThan(0);
      expect(destinationIds.length).toBeGreaterThan(0);
    },
  );

  test(
    ticketTitle(Tickets.transferFunds, 'confirms a transfer between two of the customer accounts'),
    { tag: [Tags.MUTATING, Tags.SMOKE, Tags.REGRESSION, featureTag('ui-transfer-funds')] },
    async ({ registeredCustomer, accountOverviewPage, accountService, transferFundsPage }) => {
      await accountOverviewPage.menuAccountOverview.waitFor({ state: 'visible' });

      // A brand-new customer owns a single account, so a second one is
      // opened to give the transfer a destination to move the money to.
      await accountService.openAccount('SAVINGS');

      await transferFundsPage.open();
      await transferFundsPage.waitForAccountsDropToPopulate();
      const sourceIds = await transferFundsPage.getFromAccountIds();
      const destinationIds = await transferFundsPage.getToAccountIds();
      const sourceId = sourceIds[0];
      if (!sourceId) {
        throw new Error('The registered customer has no account to transfer from.');
      }
      const destinationId = destinationIds.find((id) => id !== sourceId);
      if (!destinationId) {
        throw new Error('The registered customer needs a second account to transfer to.');
      }

      await transferFundsPage.transferFunds({
        amount: '10',
        fromId: sourceId,
        toId: destinationId,
      });
      await transferFundsPage.waitForResult();

      await expect(transferFundsPage.successHeading).toBeVisible();
      await expect(transferFundsPage.successHeading).toHaveText(/Transfer Complete!/i);
    },
  );

  test(
    ticketTitle(Tickets.transferFunds, 'returns to the accounts overview from the transfer page'),
    { tag: [Tags.E2E, Tags.REGRESSION, featureTag('ui-transfer-funds')] },
    async ({ overviewPage, accountOverviewPage, page }) => {
      await overviewPage.menuTransferFunds.click();
      await expect(page).toHaveURL(/transfer\.htm/);

      await overviewPage.menuAccountOverview.click();
      await expect(page).toHaveURL(/overview\.htm/);

      await accountOverviewPage.waitForAccountsToLoad();
      const rows = await accountOverviewPage.getAccountRows();
      expect(rows.length).toBeGreaterThan(0);
    },
  );
});
