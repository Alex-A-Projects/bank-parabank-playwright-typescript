import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage - the ParaBank landing page at /parabank/index.htm.
 *
 * Holds the customer login panel, "Forgot login info?" link, and the
 * Register link. The ATM / Online Services sidebars are also defined here
 * because they sit on the home page and overlap with several other pages.
 */
export class HomePage extends BasePage {
  // Login form
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotLoginLink: Locator;
  readonly registerLink: Locator;

  // Sidebar links (the ParaBank sidebar links point at WSDL/WADL service
  // endpoints rather than .htm pages, so we match by visible text.)
  readonly withdrawFundsLink: Locator;
  readonly transferFundsSidebarLink: Locator;
  readonly checkBalancesLink: Locator;
  readonly makeDepositsLink: Locator;
  readonly billPayLink: Locator;
  readonly accountHistoryLink: Locator;

  // News links
  readonly newsLink: Locator;

  constructor(page: Page) {
    super(page);

    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
    this.forgotLoginLink = page.locator('#loginPanel a:has-text("Forgot login info?")');
    this.registerLink = page.locator('#loginPanel a:has-text("Register")');

    this.withdrawFundsLink = page.locator('#rightPanel a:has-text("Withdraw Funds")').first();
    this.transferFundsSidebarLink = page.locator('#rightPanel a:has-text("Transfer Funds")').first();
    this.checkBalancesLink = page.locator('#rightPanel a:has-text("Check Balances")').first();
    this.makeDepositsLink = page.locator('#rightPanel a:has-text("Make Deposits")').first();
    this.billPayLink = page.locator('#rightPanel a:has-text("Bill Pay")').first();
    this.accountHistoryLink = page.locator('#rightPanel a:has-text("Account History")').first();

    this.newsLink = page.locator('#rightPanel .more a').first();
  }

  /** Open the public home page. */
  async open(): Promise<void> {
    await this.goto('/index.htm');
  }

  /** Submit the customer login form. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** The text of the "Customer Login" heading above the login panel. */
  async getLoginPanelHeading(): Promise<string> {
    const heading = this.page.locator('#loginPanel').locator('xpath=..').locator('h2');
    return (await heading.textContent())?.trim() ?? '';
  }

  /** The visible text of the login panel. */
  async getLoginPanelText(): Promise<string> {
    return (await this.page.locator('#loginPanel').innerText()).trim();
  }
}
