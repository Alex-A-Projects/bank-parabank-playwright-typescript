import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type NewUserPayload = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  username: string;
  password: string;
  confirm: string;
};

/**
 * RegisterPage - the new-account registration form at /parabank/register.htm.
 *
 * Captures every form field by name and exposes both a "fill everything at
 * once" helper (`register`) and granular setters used by negative tests.
 */
export class RegisterPage extends BasePage {
  readonly heading: Locator;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly ssnInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmInput: Locator;

  readonly registerButton: Locator;

  /** The heading ParaBank shows once registration succeeds. */
  readonly successHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();

    this.firstNameInput = page.locator('input#customer\\.firstName, input[name="customer.firstName"]');
    this.lastNameInput = page.locator('input#customer\\.lastName, input[name="customer.lastName"]');
    this.addressInput = page.locator('input#customer\\.address\\.street, input[name="customer.address.street"]');
    this.cityInput = page.locator('input#customer\\.address\\.city, input[name="customer.address.city"]');
    this.stateInput = page.locator('input#customer\\.address\\.state, input[name="customer.address.state"]');
    this.zipCodeInput = page.locator('input#customer\\.address\\.zipCode, input[name="customer.address.zipCode"]');
    this.phoneInput = page.locator('input#customer\\.phoneNumber, input[name="customer.phoneNumber"]');
    this.ssnInput = page.locator('input#customer\\.ssn, input[name="customer.ssn"]');
    this.usernameInput = page.locator('input#customer\\.username, input[name="customer.username"]');
    this.passwordInput = page.locator('input#customer\\.password, input[name="customer.password"]');
    this.confirmInput = page.locator('input#repeatedPassword, input[name="repeatedPassword"]');

    this.registerButton = page.locator('input[value="Register"]');

    this.successHeading = page
      .locator('#rightPanel h1.title')
      .filter({ hasText: /Welcome|Thank you/i })
      .first();
  }

  async open(): Promise<void> {
    await this.goto('/register.htm');
  }

  /**
   * Wait until the application has accepted a registration.
   *
   * ParaBank answers a successful registration with the welcome panel,
   * and that panel only appears once the customer has been written. The
   * wait is what makes it safe for the next step to act as the new
   * customer.
   */
  async waitForSuccess(timeoutMs = 20_000): Promise<void> {
    await this.successHeading.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async register(user: NewUserPayload): Promise<void> {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.addressInput.fill(user.address);
    await this.cityInput.fill(user.city);
    await this.stateInput.fill(user.state);
    await this.zipCodeInput.fill(user.zipCode);
    await this.phoneInput.fill(user.phone);
    await this.ssnInput.fill(user.ssn);
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.confirmInput.fill(user.confirm);
    await this.registerButton.click();
  }

  /** Fill only the fields supplied, leaving the rest untouched. */
  async fillFields(fields: Partial<NewUserPayload>): Promise<void> {
    const setters: Array<[keyof NewUserPayload, Locator]> = [
      ['firstName', this.firstNameInput],
      ['lastName', this.lastNameInput],
      ['address', this.addressInput],
      ['city', this.cityInput],
      ['state', this.stateInput],
      ['zipCode', this.zipCodeInput],
      ['phone', this.phoneInput],
      ['ssn', this.ssnInput],
      ['username', this.usernameInput],
      ['password', this.passwordInput],
      ['confirm', this.confirmInput],
    ];

    for (const [field, locator] of setters) {
      const value = fields[field];
      if (value !== undefined) {
        await locator.fill(value);
      }
    }
  }

  /** Submit the form with whatever is currently filled in. */
  async submit(): Promise<void> {
    await this.registerButton.click();
  }
}
