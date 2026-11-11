import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import type { OpenableAccountType } from '../models';

/**
 * OpenAccountPage - /parabank/openaccount.htm
 *
 * Allows the user to open an additional CHECKING or SAVINGS account.
 * The selected type comes from a dropdown, then the form submits to the
 * same URL; on success the new account number is shown with a
 * "congratulations" heading.
 */
export class OpenAccountPage extends BasePage {
  readonly heading: Locator;
  readonly formPanel: Locator;
  readonly typeDropdown: Locator;
  readonly existingAccountDropdown: Locator;
  readonly openAccountButton: Locator;
  readonly resultPanel: Locator;
  readonly errorPanel: Locator;

  /** The "Account Opened!" success heading. */
  readonly successHeading: Locator;
  /** The link holding the newly created account number. */
  readonly newAccountId: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.formPanel = page.locator('#openAccountForm');
    this.typeDropdown = page.locator('select#type, select[name="type"]');
    this.existingAccountDropdown = page.locator('select#fromAccountId, select[name="fromAccountId"]');
    this.openAccountButton = page.locator(
      'input[value="Open New Account"], button:has-text("Open New Account")',
    );
    this.resultPanel = page.locator('#openAccountResult');
    this.errorPanel = page.locator('#openAccountError');

    this.successHeading = this.resultPanel.locator('h1.title');
    this.newAccountId = page.locator('#newAccountId');
  }

  async open(): Promise<void> {
    await this.goto('/openaccount.htm');
  }

  /** Wait until the existing-account dropdown has at least one option. */
  async waitForAccountsDropToPopulate(): Promise<void> {
    await this.waitForOptions(this.existingAccountDropdown);
  }

  /**
   * Open an account of the given type.
   *
   * The account-type dropdown stores numeric values (`0` = CHECKING,
   * `1` = SAVINGS), so the option is chosen by its visible label.
   */
  async openAccount(type: OpenableAccountType, fromAccountId?: string): Promise<void> {
    await this.typeDropdown.selectOption({ label: type });
    if (fromAccountId) {
      await this.existingAccountDropdown.selectOption(fromAccountId);
    }
    await this.openAccountButton.click();
  }

  /**
   * Wait for the AJAX result of the "Open New Account" call.
   *
   * The page does not navigate on submit - it posts in the background and
   * then reveals either the result panel or the error panel - so the
   * result has to be waited for explicitly.
   */
  async waitForResult(timeoutMs = 15_000): Promise<void> {
    await this.resultPanel
      .or(this.errorPanel)
      .first()
      .waitFor({ state: 'visible', timeout: timeoutMs });
  }

  /** The account number of the account that was just opened. */
  async getNewAccountId(): Promise<string> {
    return ((await this.newAccountId.textContent()) ?? '').trim();
  }

  /** The account types offered in the dropdown. */
  async getAvailableTypes(): Promise<string[]> {
    return await this.typeDropdown.locator('option').allTextContents();
  }

  /** The account ids offered in the source-account dropdown. */
  async getAvailableAccountIds(): Promise<string[]> {
    const options = await this.existingAccountDropdown.locator('option').evaluateAll(
      (nodes) => nodes.map((node) => (node as HTMLOptionElement).value).filter(Boolean),
    );
    return options;
  }
}
