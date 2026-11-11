import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';
import { demoCustomer } from '../src/shared/env';

/**
 * Login (PB-1004).
 *
 * The customer login panel that ParaBank renders on every unauthenticated
 * page. The panel posts to /login.htm and either lands the customer on the
 * accounts overview or re-renders the panel with an error.
 *
 * Read-only: the only test that signs in uses the seeded demo customer.
 */
test.describe('Login', () => {
  test(
    ticketTitle(Tickets.login, 'rejects an empty submission and explains what is missing'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await homePage.loginButton.click();

      await expect(page).toHaveURL(/login\.htm/);
      await expect(homePage.errorPanel.first()).toBeVisible();
      expect(await homePage.getErrorMessage()).toMatch(/username and password/i);
    },
  );

  test(
    ticketTitle(Tickets.login, 'names the username input "username"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, loginPanel }) => {
      await homePage.open();

      await expect(loginPanel.usernameInput).toHaveAttribute('name', 'username');
    },
  );

  test(
    ticketTitle(Tickets.login, 'names the password input "password"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, loginPanel }) => {
      await homePage.open();

      await expect(loginPanel.passwordInput).toHaveAttribute('name', 'password');
    },
  );

  test(
    ticketTitle(Tickets.login, 'masks the password input'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, loginPanel }) => {
      await homePage.open();

      await expect(loginPanel.passwordInput).toHaveAttribute('type', 'password');
    },
  );

  test(
    ticketTitle(Tickets.login, 'labels the submit button "Log In"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, loginPanel }) => {
      await homePage.open();

      await expect(loginPanel.loginButton).toHaveValue('Log In');
    },
  );

  test(
    ticketTitle(Tickets.login, 'keeps both credential inputs editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, loginPanel }) => {
      await homePage.open();

      await expect(loginPanel.usernameInput).toBeEditable();
      await expect(loginPanel.passwordInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.login, 'rejects a submission that carries only a username'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, loginPanel, page }) => {
      await homePage.open();

      await loginPanel.usernameInput.fill('not-a-registered-customer');
      await loginPanel.loginButton.click();

      await expect(page).toHaveURL(/login\.htm/);
      await expect(homePage.errorPanel.first()).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.login, 'rejects a submission that carries only a password'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, loginPanel, page }) => {
      await homePage.open();

      await loginPanel.passwordInput.fill('not-a-registered-password');
      await loginPanel.loginButton.click();

      await expect(page).toHaveURL(/login\.htm/);
      await expect(homePage.errorPanel.first()).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.login, 'signs the demo customer in and opens the accounts overview'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-login')] },
    async ({ homePage, page }) => {
      await homePage.open();

      await homePage.login(demoCustomer.username, demoCustomer.password);

      await expect(page).toHaveURL(/overview\.htm/);
      await expect(page.locator('#rightPanel h1.title').first()).toContainText(/Accounts Overview/i);
    },
  );
});
