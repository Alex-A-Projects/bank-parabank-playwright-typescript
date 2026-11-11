import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Open New Account (PB-1010).
 *
 * The form behind "Open New Account" in the post-login menu. The customer
 * picks an account type, ParaBank opens the account from one of the
 * existing accounts and reports the number of the new account.
 *
 * The first two tests are read-only and run against the seeded demo
 * customer. The test that opens an account registers its own customer
 * first, so the shared demo data is never modified.
 */
test.describe('Open New Account', () => {
  test(
    ticketTitle(Tickets.openAccount, 'offers CHECKING and SAVINGS as the account types'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-open-account')] },
    async ({ overviewPage, openAccountPage }) => {
      await overviewPage.menuOpenAccount.click();

      await expect(openAccountPage.heading).toContainText(/Open New Account/i);
      const accountTypes = await openAccountPage.getAvailableTypes();
      expect(accountTypes).toEqual(expect.arrayContaining(['CHECKING', 'SAVINGS']));
    },
  );

  test(
    ticketTitle(Tickets.openAccount, 'lists the accounts a new account can be funded from'),
    { tag: [Tags.REGRESSION, featureTag('ui-open-account')] },
    async ({ overviewPage, openAccountPage }) => {
      await overviewPage.menuOpenAccount.click();
      await openAccountPage.waitForAccountsDropToPopulate();

      const accountIds = await openAccountPage.getAvailableAccountIds();
      expect(accountIds.length).toBeGreaterThan(0);
      for (const accountId of accountIds) {
        expect(accountId).toMatch(/^\d+$/);
      }
    },
  );

  test(
    ticketTitle(Tickets.openAccount, 'opens a SAVINGS account and reports its number'),
    { tag: [Tags.MUTATING, Tags.SMOKE, Tags.REGRESSION, featureTag('ui-open-account')] },
    async ({ registeredCustomer, accountOverviewPage, openAccountPage }) => {
      // The registration request runs in the background; the post-login menu
      // only appears once the new customer's session is live.
      await accountOverviewPage.menuAccountOverview.waitFor({ state: 'visible' });

      await openAccountPage.open();
      await openAccountPage.waitForAccountsDropToPopulate();
      const [sourceAccountId] = await openAccountPage.getAvailableAccountIds();
      if (!sourceAccountId) {
        throw new Error('The registered customer has no account to fund the new one from.');
      }

      await openAccountPage.openAccount('SAVINGS', sourceAccountId);
      await openAccountPage.waitForResult();

      await expect(openAccountPage.successHeading).toBeVisible();
      await expect(openAccountPage.successHeading).toHaveText(/Account Opened!/i);
      expect(await openAccountPage.getNewAccountId()).toMatch(/^\d+$/);
    },
  );
});
