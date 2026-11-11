import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Contact page (PB-1003).
 *
 * Covers the customer-care page: its heading and copy, the four contact
 * form fields, and the global chrome (header / breadcrumb / footer /
 * login panel) that stays available on every public page.
 *
 * The `contactPage` fixture does not navigate on its own - each test
 * opens the page explicitly.
 */
test.describe('Contact page', () => {
  test(
    ticketTitle(Tickets.contact, 'opens the Contact page from the home page footer link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ homePage, contactPage, page }) => {
      await homePage.open();

      await homePage.footerContactLink.click();

      await expect(page).toHaveURL(/contact\.htm/);
      await expect(contactPage.heading).toContainText(/Customer Care/i);
    },
  );

  test(
    ticketTitle(Tickets.contact, 'opens the Contact page directly from a deep link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      await expect(page).toHaveURL(/contact\.htm/);
      await expect(contactPage.heading).toHaveText(/Customer Care/i);
    },
  );

  test(
    ticketTitle(Tickets.contact, 'has a ParaBank page title'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      await expect(page).toHaveTitle(/ParaBank/);
    },
  );

  test(
    ticketTitle(Tickets.contact, 'explains how to reach support'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage }) => {
      await contactPage.open();

      expect(await contactPage.getBodyText()).toMatch(/Email support is available/i);
    },
  );

  test(
    ticketTitle(Tickets.contact, 'keeps the global header navigation available'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage }) => {
      await contactPage.open();

      await expect(contactPage.logoLink).toBeVisible();
      await expect(contactPage.aboutUsLink).toBeVisible();
      await expect(contactPage.servicesLink).toBeVisible();
      await expect(contactPage.adminPageLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.contact, 'shows the home / about / contact breadcrumb'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      const breadcrumb = page.locator('ul.button').first();
      await expect(breadcrumb).toContainText('home');
      await expect(breadcrumb).toContainText('about');
      await expect(breadcrumb).toContainText('contact');
    },
  );

  test(
    ticketTitle(Tickets.contact, 'renders the customer login panel'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, loginPanel }) => {
      await contactPage.open();

      await expect(loginPanel.usernameInput).toBeVisible();
      await expect(loginPanel.passwordInput).toBeVisible();
      await expect(loginPanel.loginButton).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.contact, 'returns to the home page when the ParaBank logo is clicked'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      await contactPage.clickLogo();

      await expect(page).toHaveURL(/index\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.contact, 'navigates to the home page from the breadcrumb'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      await page.locator('.button a[href*="index.htm"]').first().click();

      await expect(page).toHaveURL(/index\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.contact, 'navigates to the About page from the breadcrumb'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      await page.locator('.button a[href*="about.htm"]').first().click();

      await expect(page).toHaveURL(/about\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.contact, 'offers an editable name field'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      const nameField = page.locator('input#name, input[name="name"]').first();
      await expect(nameField).toBeVisible();
      await expect(nameField).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.contact, 'offers an editable email field'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      const emailField = page.locator('input#email, input[name="email"]').first();
      await expect(emailField).toBeVisible();
      await expect(emailField).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.contact, 'offers an editable phone field'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      const phoneField = page.locator('input#phone, input[name="phone"]').first();
      await expect(phoneField).toBeVisible();
      await expect(phoneField).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.contact, 'offers an editable message field'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      const messageField = page.locator('textarea#message, textarea[name="message"]').first();
      await expect(messageField).toBeVisible();
      await expect(messageField).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.contact, 'submits the form with a "Send to Customer Care" button'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      await expect(page.locator('input[value="Send to Customer Care"]')).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.contact, 'stays on the Contact page while the form is filled in'),
    { tag: [Tags.REGRESSION, featureTag('ui-contact')] },
    async ({ contactPage, page }) => {
      await contactPage.open();

      await page.locator('input[name="name"]').fill('Alex Tester');
      await page.locator('input[name="email"]').fill('alex.tester@example.com');
      await page.locator('input[name="phone"]').fill('555-123-4567');
      await page.locator('textarea[name="message"]').fill('Hello, this is a test message.');

      await expect(page).toHaveURL(/contact\.htm/);
    },
  );
});
