import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TransferFundsPage - /parabank/transfer.htm
 *
 * Allows moving funds between two of the customer's own accounts.
 */
export class TransferFundsPage extends BasePage {
  readonly heading: Locator;
  readonly amountInput: Locator;
  readonly fromAccountDropdown: Locator;
  readonly toAccountDropdown: Locator;
  readonly transferButton: Locator;
  readonly resultHeading: Locator;

  /** The "Transfer Complete" success heading. */
  readonly successHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.amountInput = page.locator('input#amount, input[name="amount"]');
    this.fromAccountDropdown = page.locator('select#fromAccountId, select[name="fromAccountId"]');
    this.toAccountDropdown = page.locator('select#toAccountId, select[name="toAccountId"]');
    this.transferButton = page.locator('input[value="Transfer"], button:has-text("Transfer")');
    this.resultHeading = page.locator('#showResult h1.title');

    // ParaBank re-renders the same page with a success heading. The
    // exact selector drifts between versions, so match anywhere on the
    // right panel as long as it contains the success phrase.
    this.successHeading = page
      .locator('#rightPanel h1.title')
      .filter({ hasText: /Transfer Complete/i })
      .first();
  }

  async open(): Promise<void> {
    await this.goto('/transfer.htm');
  }

  /**
   * Wait until both account dropdowns have at least one option.
   *
   * The dropdowns are server-rendered with the user's accounts and can
   * briefly render empty if the demo data is still initialising.
   */
  async waitForAccountsDropToPopulate(): Promise<void> {
    await this.waitForOptions(this.fromAccountDropdown);
    await this.waitForOptions(this.toAccountDropdown);
  }

  async transferFunds(opts: { amount: string; fromId: string; toId: string }): Promise<void> {
    await this.amountInput.fill(opts.amount);
    await this.fromAccountDropdown.selectOption(opts.fromId);
    await this.toAccountDropdown.selectOption(opts.toId);
    await this.transferButton.click();
  }

  /** The account ids offered in the source-account dropdown. */
  async getFromAccountIds(): Promise<string[]> {
    return await this.fromAccountDropdown.locator('option').evaluateAll(
      (nodes) => nodes.map((node) => (node as HTMLOptionElement).value).filter(Boolean),
    );
  }

  /** The account ids offered in the destination-account dropdown. */
  async getToAccountIds(): Promise<string[]> {
    return await this.toAccountDropdown.locator('option').evaluateAll(
      (nodes) => nodes.map((node) => (node as HTMLOptionElement).value).filter(Boolean),
    );
  }

  /**
   * Wait for the transfer result panel.
   *
   * The transfer form is a real form submit, so the browser navigates;
   * the result panel is part of the page that comes back.
   */
  async waitForResult(timeoutMs = 15_000): Promise<void> {
    await this.resultHeading.waitFor({ state: 'visible', timeout: timeoutMs });
  }
}
