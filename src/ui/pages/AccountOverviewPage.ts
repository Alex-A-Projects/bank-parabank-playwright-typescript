import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AccountOverviewPage - the landing page after login (/parabank/overview.htm).
 *
 * Shows the customer's accounts table: each row has an account number link
 * plus a balance. A global "Accounts Overview" header sits above the table.
 */
export class AccountOverviewPage extends BasePage {
  readonly heading: Locator;
  readonly accountsTable: Locator;
  readonly accountRows: Locator;
  readonly totalRow: Locator;
  readonly accountNumberLinks: Locator;

  // Left-menu links (available after login)
  readonly menuOpenAccount: Locator;
  readonly menuAccountOverview: Locator;
  readonly menuTransferFunds: Locator;
  readonly menuBillPay: Locator;
  readonly menuFindTransactions: Locator;
  readonly menuUpdateContactInfo: Locator;
  readonly menuRequestLoan: Locator;
  readonly menuLogOut: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.accountsTable = page.locator('#accountTable');
    this.accountRows = page.locator('#accountTable tbody tr');
    this.totalRow = this.accountRows.filter({ hasText: /^Total/ });
    this.accountNumberLinks = page.locator('#accountTable a');

    // The left nav is rendered inside #leftPanel after authentication
    this.menuOpenAccount = page.locator('#leftPanel a[href*="openaccount.htm"]');
    this.menuAccountOverview = page.locator('#leftPanel a[href*="overview.htm"]');
    this.menuTransferFunds = page.locator('#leftPanel a[href*="transfer.htm"]');
    this.menuBillPay = page.locator('#leftPanel a[href*="billpay.htm"]');
    this.menuFindTransactions = page.locator('#leftPanel a[href*="findtrans.htm"]');
    this.menuUpdateContactInfo = page.locator('#leftPanel a[href*="updateprofile.htm"]');
    this.menuRequestLoan = page.locator('#leftPanel a[href*="requestloan.htm"]');
    this.menuLogOut = page.locator('#leftPanel a[href*="logout.htm"]');
  }

  async open(): Promise<void> {
    await this.goto('/overview.htm');
  }

  /**
   * Wait for the accounts table to be populated.
   *
   * The table is filled in by an XHR after the page loads, so the markup
   * is present but empty on first paint. Waiting on the row state - not
   * on a fixed delay - is what makes the table readable.
   */
  async waitForAccountsToLoad(timeoutMs = 15_000): Promise<void> {
    await this.accountRows.first().waitFor({ state: 'attached', timeout: timeoutMs });
  }

  /** Number of account rows visible (excluding the header and the Total row). */
  async getAccountRowCount(): Promise<number> {
    return await this.accountRows.filter({ hasNot: this.page.locator('td', { hasText: /^Total$/ }) }).count();
  }

  /** Click an account number to drill into its details. */
  async clickAccountByIndex(index: number): Promise<void> {
    await this.accountNumberLinks.nth(index).click();
  }

  /**
   * Get the total balance string as displayed in the table.
   * ParaBank renders the "Total" cell inside <tbody> rather than <tfoot>;
   * we find it by searching for any row whose first cell reads "Total".
   */
  async getTotalBalance(): Promise<string> {
    const totalCellText = await this.totalRow
      .first()
      .locator('td')
      .nth(1)
      .textContent();
    return (totalCellText ?? '').trim();
  }

  /**
   * Parse every account row in the table and return
   * `{ accountNumber, balance }` pairs in row order.
   *
   * The "Total" row is excluded - it is a summary row, not an account.
   * The `accountTable` columns are: [Account, Balance, Available].
   */
  async getAccountRows(): Promise<Array<{ accountNumber: string; balance: string }>> {
    const rows = await this.accountRows.evaluateAll((trs) =>
      trs
        .filter((tr) => {
          const first = tr.querySelector('td')?.textContent?.trim() ?? '';
          return first !== 'Total';
        })
        .map((tr) => {
          const cells = tr.querySelectorAll('td');
          return {
            accountNumber: (cells[0]?.textContent ?? '').trim(),
            balance: (cells[1]?.textContent ?? '').trim(),
          };
        }),
    );
    return rows;
  }

  /** The account ids available in the left-menu navigation, if rendered. */
  async getMenuLinkTexts(): Promise<string[]> {
    return await this.page.locator('#leftPanel a').allTextContents();
  }
}
