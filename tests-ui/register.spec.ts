import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';
import { customerFactory } from '../src/shared/factories';

/**
 * Registration (PB-1007).
 *
 * The sign-up form at /register.htm. Every test that actually creates a
 * customer goes through the `registeredCustomer` fixture, which registers a
 * uniquely named customer of its own so the seeded demo customer is never
 * touched.
 */
test.describe('Registration', () => {
  test(
    ticketTitle(Tickets.register, 'is reachable from the home page Register link'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ homePage, registerPage, page }) => {
      await homePage.open();

      await homePage.registerLink.click();

      await expect(page).toHaveURL(/register\.htm/);
      await expect(registerPage.heading).toContainText(/Signing up is easy/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'loads directly from a deep link'),
    { tag: [Tags.E2E, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage, page }) => {
      await registerPage.open();

      await expect(page.locator('#rightPanel')).toBeVisible();
      await expect(registerPage.registerButton).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.register, 'titles the page as a ParaBank registration page'),
    { tag: [Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage, page }) => {
      await registerPage.open();

      await expect(page).toHaveTitle(/ParaBank/);
    },
  );

  test(
    ticketTitle(Tickets.register, 'heads the page with "Signing up is easy!"'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.heading).toContainText(/Signing up is easy!/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'renders all eleven registration fields'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.firstNameInput).toBeEditable();
      await expect(registerPage.lastNameInput).toBeEditable();
      await expect(registerPage.addressInput).toBeEditable();
      await expect(registerPage.cityInput).toBeEditable();
      await expect(registerPage.stateInput).toBeEditable();
      await expect(registerPage.zipCodeInput).toBeEditable();
      await expect(registerPage.phoneInput).toBeEditable();
      await expect(registerPage.ssnInput).toBeEditable();
      await expect(registerPage.usernameInput).toBeEditable();
      await expect(registerPage.passwordInput).toBeEditable();
      await expect(registerPage.confirmInput).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the first name input "customer.firstName"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.firstNameInput).toHaveAttribute('name', 'customer.firstName');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the last name input "customer.lastName"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.lastNameInput).toHaveAttribute('name', 'customer.lastName');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the street address input "customer.address.street"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.addressInput).toHaveAttribute('name', 'customer.address.street');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the city input "customer.address.city"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.cityInput).toHaveAttribute('name', 'customer.address.city');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the state input "customer.address.state"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.stateInput).toHaveAttribute('name', 'customer.address.state');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the zip code input "customer.address.zipCode"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.zipCodeInput).toHaveAttribute('name', 'customer.address.zipCode');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the phone number input "customer.phoneNumber"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.phoneInput).toHaveAttribute('name', 'customer.phoneNumber');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the social security number input "customer.ssn"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.ssnInput).toHaveAttribute('name', 'customer.ssn');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the username input "customer.username"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.usernameInput).toHaveAttribute('name', 'customer.username');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the password input "customer.password"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.passwordInput).toHaveAttribute('name', 'customer.password');
    },
  );

  test(
    ticketTitle(Tickets.register, 'names the password confirmation input "repeatedPassword"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.confirmInput).toHaveAttribute('name', 'repeatedPassword');
    },
  );

  test(
    ticketTitle(Tickets.register, 'masks the password and its confirmation'),
    { tag: [Tags.SECURITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');
      await expect(registerPage.confirmInput).toHaveAttribute('type', 'password');
    },
  );

  test(
    ticketTitle(Tickets.register, 'labels the submit button "Register"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage }) => {
      await registerPage.open();

      await expect(registerPage.registerButton).toHaveValue('Register');
    },
  );

  test(
    ticketTitle(Tickets.register, 'creates the customer and signs them in'),
    { tag: [Tags.MUTATING, Tags.SMOKE, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registeredCustomer, registerPage, page }) => {
      await expect(registerPage.successHeading).toBeVisible();
      await expect(registerPage.successHeading).toContainText(registeredCustomer.username);
      await expect(page.locator('#rightPanel')).toContainText(
        /Your account was created successfully/i,
      );
    },
  );

  test(
    ticketTitle(Tickets.register, 'rejects a password that does not match its confirmation'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage, page }) => {
      // The submission is rejected by the form validation, so no customer
      // record is created and the dataset stays untouched.
      const payload = customerFactory.buildWith({ confirm: 'NotTheSamePassword1!' });

      await registerPage.open();
      await registerPage.register(payload);

      await expect(page).toHaveURL(/register\.htm/);
      await expect(registerPage.errorPanel.first()).toBeVisible();
      expect(await registerPage.getErrorMessage()).toMatch(/passwords did not match/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'keeps the customer on the registration page when the form is empty'),
    { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage, page }) => {
      await registerPage.open();

      await registerPage.registerButton.click();

      await expect(page).toHaveURL(/register\.htm/);
      await expect(page.locator('#rightPanel')).toContainText(/First name is required/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'returns to the home page when the ParaBank logo is clicked'),
    { tag: [Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registerPage, page }) => {
      await registerPage.open();

      await registerPage.clickLogo();

      await expect(page).toHaveURL(/index\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.register, 'reaches the Accounts Overview tab after signing up'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registeredCustomer, accountOverviewPage, page }) => {
      await accountOverviewPage.menuAccountOverview.click();

      await expect(page).toHaveURL(/overview\.htm/);
      await expect(accountOverviewPage.heading).toContainText(/Accounts Overview/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'reaches the Open New Account tab after signing up'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registeredCustomer, accountOverviewPage, openAccountPage, page }) => {
      await accountOverviewPage.menuOpenAccount.click();

      await expect(page).toHaveURL(/openaccount\.htm/);
      await expect(openAccountPage.heading).toContainText(/Open New Account/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'reaches the Transfer Funds tab after signing up'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registeredCustomer, accountOverviewPage, transferFundsPage, page }) => {
      await accountOverviewPage.menuTransferFunds.click();

      await expect(page).toHaveURL(/transfer\.htm/);
      await expect(transferFundsPage.heading).toContainText(/Transfer Funds/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'reaches the Bill Payment tab after signing up'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registeredCustomer, accountOverviewPage, billPayPage, page }) => {
      await accountOverviewPage.menuBillPay.click();

      await expect(page).toHaveURL(/billpay\.htm/);
      await expect(billPayPage.heading).toContainText(/Bill Payment/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'reaches the Find Transactions tab after signing up'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registeredCustomer, accountOverviewPage, findTransactionsPage, page }) => {
      await accountOverviewPage.menuFindTransactions.click();

      await expect(page).toHaveURL(/findtrans\.htm/);
      await expect(findTransactionsPage.heading).toContainText(/Find Transactions/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'reaches the Update Profile tab after signing up'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registeredCustomer, accountOverviewPage, updateContactInfoPage, page }) => {
      await accountOverviewPage.menuUpdateContactInfo.click();

      await expect(page).toHaveURL(/updateprofile\.htm/);
      await expect(updateContactInfoPage.heading).toContainText(/Update Profile/i);
    },
  );

  test(
    ticketTitle(Tickets.register, 'reaches the Apply for a Loan tab after signing up'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-register')] },
    async ({ registeredCustomer, accountOverviewPage, requestLoanPage, page }) => {
      await accountOverviewPage.menuRequestLoan.click();

      await expect(page).toHaveURL(/requestloan\.htm/);
      await expect(requestLoanPage.heading).toContainText(/Apply for a Loan/i);
    },
  );
});
