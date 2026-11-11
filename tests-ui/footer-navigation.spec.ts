import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Global header / footer navigation sweep (PB-1017).
 *
 * Walks every public link in the ParaBank header and footer and asserts
 * that each one lands on the expected page. This is the sweep that
 * catches both broken links and header-removal regressions.
 *
 * Every step goes through the page objects - the home page is opened
 * with `homePage.open()` and the About page with `aboutPage.open()`.
 */
test.describe('Global header and footer navigation', () => {
  test(
    ticketTitle(Tickets.navigation, 'navigates from the home page to About via the header link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-navigation')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await homePage.aboutUsLink.click();

      await expect(page).toHaveURL(/about\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.navigation, 'navigates from the home page to Services via the header link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-navigation')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await homePage.servicesLink.click();

      await expect(page).toHaveURL(/services\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.navigation, 'navigates from the home page to the Admin page via the header link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-navigation')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await homePage.adminPageLink.click();

      await expect(page).toHaveURL(/admin\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.navigation, 'navigates from the home page to Contact via the footer link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-navigation')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await homePage.footerContactLink.click();

      await expect(page).toHaveURL(/contact\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.navigation, 'navigates from the About page back to Home via the footer link'),
    { tag: [Tags.REGRESSION, featureTag('ui-navigation')] },
    async ({ aboutPage, page }) => {
      await aboutPage.open();

      await aboutPage.footerHomeLink.click();

      await expect(page).toHaveURL(/index\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.navigation, 'navigates from the home page to the Site Map via the footer link'),
    { tag: [Tags.REGRESSION, featureTag('ui-navigation')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await homePage.footerSiteMapLink.click();

      await expect(page).toHaveURL(/sitemap\.htm/);
      await expect(page.locator('#rightPanel')).toBeVisible();
    },
  );
});
