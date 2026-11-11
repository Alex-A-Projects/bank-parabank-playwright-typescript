import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type ContactProfile = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
};

/**
 * UpdateContactInfoPage - /parabank/updateprofile.htm
 *
 * The form is pre-populated with the logged-in customer's existing
 * profile; submitting with changes updates that profile.
 *
 * ZERO ASSERTIONS - the test layer decides what a successful update is.
 */
export class UpdateContactInfoPage extends BasePage {
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly updateProfileButton: Locator;
  readonly successMessage: Locator;
  readonly errorPanel: Locator;

  /** The "Profile Updated" heading ParaBank shows on success. */
  readonly successHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.firstNameInput = page.locator('input#customer\\.firstName, input[name="customer.firstName"]');
    this.lastNameInput = page.locator('input#customer\\.lastName, input[name="customer.lastName"]');
    this.addressInput = page.locator('input[name="customer.address.street"]');
    this.cityInput = page.locator('input[name="customer.address.city"]');
    this.stateInput = page.locator('input[name="customer.address.state"]');
    this.zipCodeInput = page.locator('input[name="customer.address.zipCode"]');
    this.phoneInput = page.locator('input[name="customer.phoneNumber"]');
    this.updateProfileButton = page.locator(
      'input[value="Update Profile"], button:has-text("Update Profile")',
    );
    this.successMessage = page.locator('#updateProfileResult h1.title');
    this.errorPanel = page.locator('#updateProfileError');

    this.successHeading = page
      .locator('#rightPanel h1.title')
      .filter({ hasText: /Profile Updated/i })
      .first();
  }

  async open(): Promise<void> {
    await this.goto('/updateprofile.htm');
  }

  /** Read the currently rendered first name. */
  async getCurrentFirstName(): Promise<string> {
    return await this.firstNameInput.inputValue();
  }

  /** Read the whole pre-populated profile back out of the form. */
  async getCurrentProfile(): Promise<ContactProfile> {
    return {
      firstName: await this.firstNameInput.inputValue(),
      lastName: await this.lastNameInput.inputValue(),
      address: await this.addressInput.inputValue(),
      city: await this.cityInput.inputValue(),
      state: await this.stateInput.inputValue(),
      zipCode: await this.zipCodeInput.inputValue(),
      phone: await this.phoneInput.inputValue(),
    };
  }

  async updateProfile(profile: ContactProfile): Promise<void> {
    await this.firstNameInput.fill(profile.firstName);
    await this.lastNameInput.fill(profile.lastName);
    await this.addressInput.fill(profile.address);
    await this.cityInput.fill(profile.city);
    await this.stateInput.fill(profile.state);
    await this.zipCodeInput.fill(profile.zipCode);
    await this.phoneInput.fill(profile.phone);
    await this.updateProfileButton.click();
  }

  /**
   * Wait for the AJAX result of the profile update.
   *
   * "Update Profile" is a plain button, so the request runs in the
   * background and the page then reveals either the result panel or the
   * error panel.
   */
  async waitForResult(timeoutMs = 15_000): Promise<void> {
    await this.successMessage
      .or(this.errorPanel)
      .first()
      .waitFor({ state: 'visible', timeout: timeoutMs });
  }
}
