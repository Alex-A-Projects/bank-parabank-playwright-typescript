import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * About Us page (PB-1002).
 *
 * A static content page, so the coverage is about what it renders and
 * about the global chrome (header / footer / login panel) that stays
 * available on every public page.
 *
 * The `aboutPage` fixture does not navigate on its own - each test opens
 * the page explicitly.
 */
test.describe('About Us page', () => {
  test(
    ticketTitle(Tickets.about, 'opens the About page from the home page header link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-about')] },
    async ({ homePage, aboutPage, page }) => {
      await homePage.open();

      await homePage.aboutUsLink.click();

      await expect(page).toHaveURL(/about\.htm/);
      await expect(aboutPage.bodyHeading).toContainText(/ParaSoft/i);
    },
  );

  test(
    ticketTitle(Tickets.about, 'opens the About page directly from a deep link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage, page }) => {
      await aboutPage.open();

      await expect(page).toHaveURL(/about\.htm/);
      await expect(aboutPage.bodyHeading).toContainText(/ParaSoft/i);
    },
  );

  test(
    ticketTitle(Tickets.about, 'has a ParaBank page title'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage, page }) => {
      await aboutPage.open();

      await expect(page).toHaveTitle(/ParaBank/);
    },
  );

  test(
    ticketTitle(Tickets.about, 'heads the page with "ParaSoft Demo Website"'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage }) => {
      await aboutPage.open();

      await expect(aboutPage.bodyHeading).toHaveText(/ParaSoft Demo Website/i);
    },
  );

  test(
    ticketTitle(Tickets.about, 'states that ParaBank is not a real bank'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage }) => {
      await aboutPage.open();

      expect(await aboutPage.getBodyText()).toMatch(/not a real bank/i);
    },
  );

  test(
    ticketTitle(Tickets.about, 'renders the global ParaBank logo'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage }) => {
      await aboutPage.open();

      await expect(aboutPage.logoLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.about, 'keeps the global header navigation available'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage }) => {
      await aboutPage.open();

      await expect(aboutPage.aboutUsLink).toBeVisible();
      await expect(aboutPage.servicesLink).toBeVisible();
      await expect(aboutPage.adminPageLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.about, 'points the header About Us link at about.htm'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage }) => {
      await aboutPage.open();

      const href = await aboutPage.aboutUsLink.getAttribute('href');
      expect(href).toMatch(/about\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.about, 'shows the home / about / contact breadcrumb'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage, page }) => {
      await aboutPage.open();

      const breadcrumb = page.locator('ul.button').first();
      await expect(breadcrumb).toContainText('home');
      await expect(breadcrumb).toContainText('about');
      await expect(breadcrumb).toContainText('contact');
    },
  );

  test(
    ticketTitle(Tickets.about, 'renders the customer login panel'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage, loginPanel, homePage }) => {
      await aboutPage.open();

      await expect(loginPanel.usernameInput).toBeVisible();
      await expect(loginPanel.passwordInput).toBeVisible();
      await expect(loginPanel.loginButton).toBeVisible();
      // The Register entry point lives in the same shared login panel.
      await expect(homePage.registerLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.about, 'returns to the home page when the ParaBank logo is clicked'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage, page }) => {
      await aboutPage.open();

      await aboutPage.clickLogo();

      await expect(page).toHaveURL(/index\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.about, 'shows every expected footer link'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage }) => {
      await aboutPage.open();

      await expect(aboutPage.footerHomeLink).toBeVisible();
      await expect(aboutPage.footerAboutUsLink).toBeVisible();
      await expect(aboutPage.footerServicesLink).toBeVisible();
      await expect(aboutPage.footerContactLink).toBeVisible();
      await expect(aboutPage.footerSiteMapLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.about, 'shows the Parasoft copyright notice'),
    { tag: [Tags.REGRESSION, featureTag('ui-about')] },
    async ({ aboutPage, page }) => {
      await aboutPage.open();

      await expect(page.locator('.copyright')).toContainText(/Parasoft/i);
    },
  );
});
