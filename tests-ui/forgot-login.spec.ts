import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';
import { customerFactory } from '../src/shared/factories';

/**
 * Forgot login info (PB-1006).
 *
 * The customer-lookup form at /lookup.htm. A customer proves who they are
 * with their name, address and SSN and gets their credentials back.
 *
 * The lookup only ever resolves a customer that exists in the dataset, so
 * the "credentials are revealed" test registers its own customer first
 * (through the `registeredCustomer` fixture) and never touches the seeded
 * demo customer.
 *
 * ParaBank matches the SSN literally against the stored value, so the
 * lookup has to repeat the exact string the customer registered with -
 * re-formatting it (for example "123456789" into "123-45-6789") makes the
 * lookup miss. The registered address also decides which record the lookup
 * inspects first, so the customer is looked up under the address it was
 * registered with.
 */
test.describe('Forgot login info', () => {
  test(
    ticketTitle(Tickets.forgotLogin, 'is reachable from the home page "Forgot login info?" link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ homePage, forgotLoginPage, page }) => {
      await homePage.open();

      await homePage.forgotLoginLink.click();

      await expect(page).toHaveURL(/lookup\.htm/);
      await expect(forgotLoginPage.findLoginInfoButton).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'loads directly from a deep link'),
    { tag: [Tags.E2E, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage, page }) => {
      await forgotLoginPage.open();

      await expect(page.locator('#rightPanel')).toBeVisible();
      await expect(forgotLoginPage.findLoginInfoButton).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'serves the lookup form from lookup.htm'),
    { tag: [Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage, page }) => {
      await forgotLoginPage.open();

      await expect(page).toHaveURL(/lookup\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'titles the page as a ParaBank customer lookup'),
    { tag: [Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage, page }) => {
      await forgotLoginPage.open();

      await expect(page).toHaveTitle(/ParaBank/);
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'heads the page with "Customer Lookup"'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.heading).toContainText(/Customer Lookup/i);
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'explains which information the customer has to provide'),
    { tag: [Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage, page }) => {
      await forgotLoginPage.open();

      await expect(page.locator('#rightPanel')).toContainText(/Please fill out the following information/i);
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the first name input visible and editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.firstNameInput).toBeVisible();
      await expect(forgotLoginPage.firstNameInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the last name input visible and editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.lastNameInput).toBeVisible();
      await expect(forgotLoginPage.lastNameInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the address input visible and editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.addressInput).toBeVisible();
      await expect(forgotLoginPage.addressInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the city input visible and editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.cityInput).toBeVisible();
      await expect(forgotLoginPage.cityInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the state input visible and editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.stateInput).toBeVisible();
      await expect(forgotLoginPage.stateInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the zip code input visible and editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.zipCodeInput).toBeVisible();
      await expect(forgotLoginPage.zipCodeInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the social security number input visible and editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.ssnInput).toBeVisible();
      await expect(forgotLoginPage.ssnInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'labels the submit button "Find My Login Info"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.findLoginInfoButton).toHaveValue('Find My Login Info');
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'reveals the credentials of a registered customer'),
    { tag: [Tags.MUTATING, Tags.SMOKE, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ registeredCustomer, customerService, page }) => {
      await customerService.requestLoginInfo({
        firstName: registeredCustomer.firstName,
        lastName: registeredCustomer.lastName,
        address: registeredCustomer.address,
        city: registeredCustomer.city,
        state: registeredCustomer.state,
        zipCode: registeredCustomer.zipCode,
        ssn: registeredCustomer.ssn,
      });

      await expect(page.locator('#rightPanel')).toContainText(
        /Your login information was located successfully/i,
      );
      await expect(page.locator('#rightPanel')).toContainText(registeredCustomer.username);
      await expect(page.locator('#rightPanel')).toContainText(/Username:/);
      await expect(page.locator('#rightPanel')).toContainText(/Password:/);
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'reports that an unknown customer cannot be found'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ customerService, page }) => {
      const unknownCustomer = customerFactory.build();

      await customerService.requestLoginInfo({
        firstName: unknownCustomer.firstName,
        lastName: unknownCustomer.lastName,
        address: unknownCustomer.address,
        city: unknownCustomer.city,
        state: unknownCustomer.state,
        zipCode: unknownCustomer.zipCode,
        ssn: unknownCustomer.ssn,
      });

      await expect(page.locator('#rightPanel')).toContainText(/could not be found/i);
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the customer on the lookup page when the form is empty'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage, page }) => {
      await forgotLoginPage.open();

      await forgotLoginPage.findLoginInfoButton.click();

      await expect(page).toHaveURL(/lookup\.htm/);
      await expect(page.locator('#rightPanel')).toContainText(/First name is required/i);
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'flags every field the customer left empty'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage, page }) => {
      await forgotLoginPage.open();

      await forgotLoginPage.firstNameInput.fill('Auto');
      await forgotLoginPage.findLoginInfoButton.click();

      await expect(page).toHaveURL(/lookup\.htm/);
      await expect(page.locator('#rightPanel')).toContainText(/Last name is required/i);
      await expect(page.locator('#rightPanel')).toContainText(/Social Security Number is required/i);
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the global ParaBank logo visible'),
    { tag: [Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage }) => {
      await forgotLoginPage.open();

      await expect(forgotLoginPage.logoLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.forgotLogin, 'keeps the customer login panel available on the lookup page'),
    { tag: [Tags.REGRESSION, featureTag('ui-forgot-login')] },
    async ({ forgotLoginPage, page }) => {
      await forgotLoginPage.open();

      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    },
  );
});
