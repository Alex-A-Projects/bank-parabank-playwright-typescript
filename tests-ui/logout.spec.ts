import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Logout (PB-1005).
 *
 * The Log Out entry of the post-login menu. Every test starts from the
 * `overviewPage` fixture, which is the accounts overview of the seeded demo
 * customer - logging out is a read-only operation on the demo dataset.
 */
test.describe('Logout', () => {
  test(
    ticketTitle(Tickets.logout, 'offers a Log Out link in the post-login menu'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-logout')] },
    async ({ overviewPage }) => {
      await expect(overviewPage.menuLogOut).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.logout, 'points the Log Out link at logout.htm'),
    { tag: [Tags.REGRESSION, featureTag('ui-logout')] },
    async ({ overviewPage }) => {
      const href = await overviewPage.menuLogOut.getAttribute('href');

      expect(href).toMatch(/logout\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.logout, 'returns the customer to the login page'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-logout')] },
    async ({ overviewPage, page }) => {
      await overviewPage.menuLogOut.click();

      await expect(page).toHaveURL(/index\.htm/);
      await expect(page.locator('input[name="username"]')).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.logout, 'removes the post-login menu once the customer is logged out'),
    { tag: [Tags.REGRESSION, featureTag('ui-logout')] },
    async ({ overviewPage, page }) => {
      await overviewPage.menuLogOut.click();

      await expect(page).toHaveURL(/index\.htm/);
      await expect(overviewPage.menuLogOut).toHaveCount(0);
    },
  );

  test(
    ticketTitle(Tickets.logout, 'stops serving the accounts overview to a signed-out customer'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-logout')] },
    async ({ overviewPage, accountOverviewPage, page }) => {
      await overviewPage.menuLogOut.click();
      await expect(page).toHaveURL(/index\.htm/);

      await accountOverviewPage.open();

      await expect(page.locator('#rightPanel')).toBeVisible();
      await expect(page.locator('#accountTable')).toHaveCount(0);
    },
  );
});
