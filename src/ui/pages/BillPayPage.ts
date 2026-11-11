import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type PayeeInput = {
  payeeName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  accountNumber: string;
  verifyAccount: string;
  amount: string;
  fromAccountId: string;
};

/**
 * BillPayPage - /parabank/billpay.htm
 *
 * Has two parts on a single page:
 *  - Payee form (name/address/account plus amount + the funding account).
 *  - Find a payee by name (uses the same upper form via clear/fill).
 *
 * ZERO ASSERTIONS - the test layer decides what a valid payment looks like.
 */
export class BillPayPage extends BasePage {
  readonly heading: Locator;
  readonly payeeNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly accountInput: Locator;
  readonly verifyAccountInput: Locator;
  readonly amountInput: Locator;
  readonly fromAccountDropdown: Locator;
  readonly sendPaymentButton: Locator;
  readonly resultHeading: Locator;
  readonly errorPanel: Locator;

  /** The "Bill Payment Complete" heading ParaBank shows on success. */
  readonly successHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.payeeNameInput = page.locator('input[name="payee.name"]');
    this.addressInput = page.locator('input[name="payee.address.street"]');
    this.cityInput = page.locator('input[name="payee.address.city"]');
    this.stateInput = page.locator('input[name="payee.address.state"]');
    this.zipCodeInput = page.locator('input[name="payee.address.zipCode"]');
    this.phoneInput = page.locator('input[name="payee.phoneNumber"]');
    this.accountInput = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccountInput = page.locator('input[name="verifyAccount"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.fromAccountDropdown = page.locator('select[name="fromAccountId"]');
    this.sendPaymentButton = page.locator(
      'input[value="Send Payment"], button:has-text("Send Payment")',
    );
    this.resultHeading = page.locator('#billpayResult h1.title');
    this.errorPanel = page.locator('#billpayError');

    this.successHeading = page
      .locator('#rightPanel h1.title')
      .filter({ hasText: /Bill Payment Complete/i })
      .first();
  }

  async open(): Promise<void> {
    await this.goto('/billpay.htm');
  }

  /** Wait until the funding-account dropdown has at least one option. */
  async waitForAccountsDropToPopulate(): Promise<void> {
    await this.waitForOptions(this.fromAccountDropdown);
  }

  async pay(payee: PayeeInput): Promise<void> {
    await this.payeeNameInput.fill(payee.payeeName);
    await this.addressInput.fill(payee.address);
    await this.cityInput.fill(payee.city);
    await this.stateInput.fill(payee.state);
    await this.zipCodeInput.fill(payee.zipCode);
    await this.phoneInput.fill(payee.phone);
    await this.accountInput.fill(payee.accountNumber);
    await this.verifyAccountInput.fill(payee.verifyAccount);
    await this.amountInput.fill(payee.amount);
    await this.fromAccountDropdown.selectOption(payee.fromAccountId);
    await this.sendPaymentButton.click();
  }

  /** Read back the currently rendered payee name (used by "find payee" checks). */
  async getRenderedPayeeName(): Promise<string> {
    return ((await this.payeeNameInput.inputValue()) ?? '').trim();
  }

  /**
   * Wait for the AJAX result of the payment.
   *
   * "Send Payment" is a plain button, so the request runs in the
   * background and the page then reveals either the result panel or the
   * error panel.
   */
  async waitForResult(timeoutMs = 15_000): Promise<void> {
    await this.resultHeading
      .or(this.errorPanel)
      .first()
      .waitFor({ state: 'visible', timeout: timeoutMs });
  }

  /**
   * The inline validation messages ParaBank renders under the form.
   *
   * Each one is a `.error` element with a `validationModel-*` id.
   */
  async getValidationErrorTexts(): Promise<string[]> {
    return await this.page
      .locator('#billpayForm .error')
      .evaluateAll((nodes) =>
        nodes
          .map((node) => (node.textContent ?? '').trim())
          .filter((text) => text.length > 0),
      );
  }
}
