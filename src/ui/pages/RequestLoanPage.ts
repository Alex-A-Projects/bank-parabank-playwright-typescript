import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * RequestLoanPage - /parabank/requestloan.htm
 *
 * Lets the user apply for a loan by funding source, down payment and
 * account id. On approval a new loan account is granted.
 *
 * ZERO ASSERTIONS - the test layer decides what a granted loan looks like.
 */
export class RequestLoanPage extends BasePage {
  readonly heading: Locator;
  readonly loanAmountInput: Locator;
  readonly downPaymentInput: Locator;
  readonly fromAccountDropdown: Locator;
  readonly applyNowButton: Locator;
  readonly resultHeading: Locator;
  readonly errorPanel: Locator;
  readonly loanStatus: Locator;

  /** The "Loan Request Processed" heading ParaBank shows on success. */
  readonly successHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.loanAmountInput = page.locator('input#amount, input[name="amount"]');
    this.downPaymentInput = page.locator('input#downPayment, input[name="downPayment"]');
    this.fromAccountDropdown = page.locator('select#fromAccountId, select[name="fromAccountId"]');
    this.applyNowButton = page.locator('input[value="Apply Now"], button:has-text("Apply Now")');
    this.resultHeading = page.locator('#requestLoanResult h1.title');
    this.errorPanel = page.locator('#requestLoanError');
    this.loanStatus = page.locator('#loanStatus');

    this.successHeading = page
      .locator('#rightPanel h1.title')
      .filter({ hasText: /Loan Request Processed/i })
      .first();
  }

  async open(): Promise<void> {
    await this.goto('/requestloan.htm');
  }

  /**
   * Wait for the funding-source dropdown to be populated.
   *
   * The dropdown is server-rendered and may render empty briefly. The
   * population only counts DOM children because `<option>` elements are
   * not "visible" in the strict Playwright sense while the `<select>` is
   * closed - so we wait on the `attached` state, never on a fixed sleep.
   */
  async waitForAccountsDropToPopulate(): Promise<void> {
    await this.waitForOptions(this.fromAccountDropdown);
  }

  async requestLoan(opts: { amount: string; downPayment: string; fromId: string }): Promise<void> {
    await this.loanAmountInput.fill(opts.amount);
    await this.downPaymentInput.fill(opts.downPayment);
    await this.fromAccountDropdown.selectOption(opts.fromId);
    await this.applyNowButton.click();
  }

  /** The loan-status text ParaBank renders under the result panel. */
  async getLoanStatusText(): Promise<string> {
    return ((await this.loanStatus.first().textContent()) ?? '').trim();
  }

  /**
   * Wait for the AJAX result of the loan application.
   *
   * "Apply Now" is a plain button, so the request runs in the background
   * and the page then reveals either the result panel or the error panel.
   */
  async waitForResult(timeoutMs = 15_000): Promise<void> {
    await this.resultHeading
      .or(this.errorPanel)
      .first()
      .waitFor({ state: 'visible', timeout: timeoutMs });
  }
}
