import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Home page (PB-1001).
 *
 * The public landing page of ParaBank: the customer login panel, the
 * global header links, the ATM / Online Services shortcuts and the
 * entry points to the customer-lookup and registration pages.
 *
 * The `homePage` fixture does not navigate on its own - every test opens
 * the page explicitly so the navigation step stays visible.
 */
test.describe('Home page', () => {
  test(
    ticketTitle(Tickets.home, 'loads the ParaBank home page'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await expect(page).toHaveURL(/index\.htm/);
      await expect(page).toHaveTitle(/ParaBank/);
      await expect(homePage.logoLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.home, 'renders the customer login form'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage }) => {
      await homePage.open();

      await expect(homePage.usernameInput).toBeVisible();
      await expect(homePage.passwordInput).toBeVisible();
      await expect(homePage.loginButton).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.home, 'labels the login panel for the customer'),
    { tag: [Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage }) => {
      await homePage.open();

      expect(await homePage.getLoginPanelHeading()).toBe('Customer Login');
      expect(await homePage.getLoginPanelText()).toContain('Username');
      expect(await homePage.getLoginPanelText()).toContain('Password');
    },
  );

  test(
    ticketTitle(Tickets.home, 'exposes the About Us, Services and Admin Page header links'),
    { tag: [Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage }) => {
      await homePage.open();

      await expect(homePage.aboutUsLink).toBeVisible();
      await expect(homePage.servicesLink).toBeVisible();
      await expect(homePage.adminPageLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.home, 'points the header About Us link at about.htm'),
    { tag: [Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage }) => {
      await homePage.open();

      const href = await homePage.aboutUsLink.getAttribute('href');
      expect(href).toMatch(/about\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.home, 'points the header Admin Page link at admin.htm'),
    { tag: [Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage }) => {
      await homePage.open();

      const href = await homePage.adminPageLink.getAttribute('href');
      expect(href).toMatch(/admin\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.home, 'lists the ATM and Online Services shortcuts'),
    { tag: [Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage }) => {
      await homePage.open();

      await expect(homePage.withdrawFundsLink).toBeVisible();
      await expect(homePage.transferFundsSidebarLink).toBeVisible();
      await expect(homePage.checkBalancesLink).toBeVisible();
      await expect(homePage.makeDepositsLink).toBeVisible();
      await expect(homePage.billPayLink).toBeVisible();
      await expect(homePage.accountHistoryLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.home, 'navigates to the customer lookup page from the Forgot login info? link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage, page, forgotLoginPage }) => {
      await homePage.open();

      await homePage.forgotLoginLink.click();

      await expect(page).toHaveURL(/lookup\.htm/);
      await expect(forgotLoginPage.heading).toContainText(/Customer Lookup/i);
    },
  );

  test(
    ticketTitle(Tickets.home, 'navigates to the registration page from the Register link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage, page, registerPage }) => {
      await homePage.open();

      await homePage.registerLink.click();

      await expect(page).toHaveURL(/register\.htm/);
      await expect(registerPage.heading).toContainText(/Signing up is easy/i);
    },
  );

  test(
    ticketTitle(Tickets.home, 'reaches the About page through the home page navigation'),
    { tag: [Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage, page }) => {
      await homePage.goto('/about.htm');

      await expect(page).toHaveURL(/about\.htm/);
      await expect(page.locator('#rightPanel')).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.home, 'returns to the home page when the ParaBank logo is clicked'),
    { tag: [Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage, page }) => {
      await homePage.goto('/about.htm');

      await homePage.clickLogo();

      await expect(page).toHaveURL(/index\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.home, 'rejects an empty login submission with an error'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-home')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await homePage.loginButton.click();

      await expect(page).toHaveURL(/login\.htm/);
      await expect(homePage.errorPanel.first()).toBeVisible();
      expect(await homePage.getErrorMessage()).toMatch(/username and password/i);
    },
  );
});
