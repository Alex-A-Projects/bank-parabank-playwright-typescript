import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ForgotLoginPage - "Forgot login info?" lookup form.
 *
 * Used to recover username / password from first/last name + SSN + ZIP.
 */
export class ForgotLoginPage extends BasePage {
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly ssnInput: Locator;
  readonly findLoginInfoButton: Locator;

  /** The result table showing the recovered credentials, if any. */
  readonly resultTable: Locator;

  /** The heading ParaBank shows once a lookup succeeds. */
  readonly successHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();

    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.addressInput = page.locator('input[name="address.street"]');
    this.cityInput = page.locator('input[name="address.city"]');
    this.stateInput = page.locator('input[name="address.state"]');
    this.zipCodeInput = page.locator('input[name="address.zipCode"]');
    this.ssnInput = page.locator('input[name="ssn"]');
    this.findLoginInfoButton = page.locator('input[value="Find My Login Info"]');

    this.resultTable = page.locator('#rightPanel table');
    this.successHeading = page
      .locator('#rightPanel h1.title')
      .filter({ hasText: /Customer Found/i })
      .first();
  }

  async open(): Promise<void> {
    await this.goto('/lookup.htm');
  }

  async fillAndSubmit(user: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    ssn: string;
  }): Promise<void> {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.addressInput.fill(user.address);
    await this.cityInput.fill(user.city);
    await this.stateInput.fill(user.state);
    await this.zipCodeInput.fill(user.zipCode);
    await this.ssnInput.fill(user.ssn);
    await this.findLoginInfoButton.click();
  }
}
