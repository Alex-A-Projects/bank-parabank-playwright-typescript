import { Page } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { UpdateContactInfoPage } from '../pages/UpdateContactInfoPage';
import { ForgotLoginPage } from '../pages/ForgotLoginPage';
import { ContactProfile, NewCustomer } from '../models';

/**
 * CustomerService - registration and profile workflows for the UI suite.
 *
 * ZERO ASSERTIONS - the service reports what it observed and lets the
 * test layer decide whether that is correct.
 */
export class CustomerService {
  private readonly page: Page;
  private readonly registerPage: RegisterPage;
  private readonly updateContactInfoPage: UpdateContactInfoPage;
  private readonly forgotLoginPage: ForgotLoginPage;

  constructor(page: Page) {
    this.page = page;
    this.registerPage = new RegisterPage(page);
    this.updateContactInfoPage = new UpdateContactInfoPage(page);
    this.forgotLoginPage = new ForgotLoginPage(page);
  }

  /**
   * Register a brand-new customer.
   *
   * The call returns only once the application has confirmed the
   * registration, so the session is authenticated as the new customer
   * when it completes.
   */
  async register(customer: NewCustomer): Promise<void> {
    await this.registerPage.open();
    await this.registerPage.register(customer);
    await this.registerPage.waitForSuccess();
  }

  /** Fill only part of the registration form and submit it. */
  async registerPartial(fields: Partial<NewCustomer>): Promise<void> {
    await this.registerPage.open();
    await this.registerPage.fillFields(fields);
    await this.registerPage.submit();
  }

  /** Update the signed-in customer's profile. */
  async updateProfile(profile: ContactProfile): Promise<void> {
    await this.updateContactInfoPage.open();
    await this.updateContactInfoPage.updateProfile(profile);
  }

  /** Read the signed-in customer's current profile back out of the form. */
  async getCurrentProfile(): Promise<ContactProfile> {
    await this.updateContactInfoPage.open();
    return await this.updateContactInfoPage.getCurrentProfile();
  }

  /** Look up forgotten login details. */
  async requestLoginInfo(user: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    ssn: string;
  }): Promise<void> {
    await this.forgotLoginPage.open();
    await this.forgotLoginPage.fillAndSubmit(user);
  }
}
