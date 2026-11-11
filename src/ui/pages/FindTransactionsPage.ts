import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type TransactionRow = {
  id: string;
  description: string;
  amount: string;
  date: string;
};

/**
 * FindTransactionsPage - /parabank/findtrans.htm
 *
 * The actual form is a series of submit-buttons, each one a self-contained
 * search:
 *   - Find by ID          (input + #findById button)
 *   - Find by exact Date  (input + #findByDate button)
 *   - Find by Date Range  (from/to inputs + #findByDateRange button)
 *   - Find by Amount      (input + #findByAmount button)
 * There is also a `transactionType` select used by some endpoints, but the
 * demo form only exposes the above four.
 *
 * ZERO ASSERTIONS - the test layer decides what a valid result set is.
 */
export class FindTransactionsPage extends BasePage {
  readonly heading: Locator;
  readonly accountDropdown: Locator;

  readonly transactionIdInput: Locator;
  readonly findByIdButton: Locator;

  readonly transactionDateInput: Locator;
  readonly findByDateButton: Locator;

  readonly fromDateInput: Locator;
  readonly toDateInput: Locator;
  readonly findByDateRangeButton: Locator;

  readonly amountInput: Locator;
  readonly findByAmountButton: Locator;

  readonly resultsTable: Locator;
  readonly resultsBody: Locator;
  readonly errorContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.accountDropdown = page.locator('select#accountId');

    this.transactionIdInput = page.locator('input#transactionId');
    this.findByIdButton = page.locator('button#findById');

    this.transactionDateInput = page.locator('input#transactionDate');
    this.findByDateButton = page.locator('button#findByDate');

    this.fromDateInput = page.locator('input#fromDate');
    this.toDateInput = page.locator('input#toDate');
    this.findByDateRangeButton = page.locator('button#findByDateRange');

    this.amountInput = page.locator('input#amount');
    this.findByAmountButton = page.locator('button#findByAmount');

    this.resultsTable = page.locator('table#transactionTable');
    this.resultsBody = page.locator('table#transactionTable tbody#transactionBody');
    this.errorContainer = page.locator('#errorContainer');
  }

  async open(): Promise<void> {
    await this.goto('/findtrans.htm');
  }

  /** Wait until the account dropdown has at least one option. */
  async waitForAccountsDropToPopulate(): Promise<void> {
    await this.waitForOptions(this.accountDropdown);
  }

  /** Select an account from the dropdown. */
  async selectAccount(accountId: string): Promise<void> {
    await this.accountDropdown.selectOption(accountId);
  }

  /** Submit the "Find by Amount" form (no max range - just exact amount). */
  async searchByAmount(opts: { fromId: string; amount: string }): Promise<void> {
    await this.selectAccount(opts.fromId);
    await this.amountInput.fill(opts.amount);
    await this.findByAmountButton.click();
  }

  /** Submit the "Find by Date Range" form. */
  async searchByDateRange(opts: { fromId: string; from: string; to: string }): Promise<void> {
    await this.selectAccount(opts.fromId);
    await this.fromDateInput.fill(opts.from);
    await this.toDateInput.fill(opts.to);
    await this.findByDateRangeButton.click();
  }

  /** Submit the "Find by exact Date" form. */
  async searchByExactDate(opts: { fromId: string; date: string }): Promise<void> {
    await this.selectAccount(opts.fromId);
    await this.transactionDateInput.fill(opts.date);
    await this.findByDateButton.click();
  }

  /** Submit the "Find by ID" form. */
  async searchById(opts: { fromId: string; transactionId: string }): Promise<void> {
    await this.selectAccount(opts.fromId);
    await this.transactionIdInput.fill(opts.transactionId);
    await this.findByIdButton.click();
  }

  /**
   * Wait for the search results to land.
   *
   * ParaBank loads the rows via an XHR, so a `click()` returning does not
   * mean the rows are present yet. This waits on DOM state plus network
   * idleness - no fixed sleep.
   */
  async waitForResults(): Promise<void> {
    await this.resultsBody.waitFor({ state: 'attached', timeout: 10_000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  }

  /** Number of rows currently rendered in the results table body. */
  async getResultRowCount(): Promise<number> {
    return await this.resultsBody.locator('tr').count();
  }

  /**
   * Extract the rendered transaction rows.
   *
   * Used to cross-check the UI against the rows returned by the HSQLDB
   * queries in the DB suite.
   */
  async getResultRows(): Promise<TransactionRow[]> {
    return await this.resultsBody.locator('tr').evaluateAll((rows) =>
      rows.map((tr) => {
        const link = tr.querySelector('a[href*="transaction.htm?id="]');
        const href = link?.getAttribute('href') ?? '';
        const id = href.includes('?')
          ? (new URLSearchParams(href.split('?')[1]).get('id') ?? '')
          : '';
        const cells = tr.querySelectorAll('td');
        return {
          id,
          description: (cells[1]?.textContent ?? '').trim(),
          amount: (cells[2]?.textContent ?? '').trim(),
          date: (cells[3]?.textContent ?? '').trim(),
        };
      }),
    );
  }
}
