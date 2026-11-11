import { Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPanel } from '../components/LoginPanel';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';
import { demoCustomer } from '../../shared/env';

/**
 * AuthService - login/logout orchestration for the UI suite.
 *
 * A *service* sits above the Page Object layer: it sequences several
 * page interactions into one meaningful operation ("log the customer in")
 * so that a test reads as a sequence of business steps rather than a
 * sequence of DOM clicks.
 *
 * ZERO ASSERTIONS - the service reports state, the test decides what is
 * correct.
 */
export class AuthService {
  private readonly page: Page;
  private readonly homePage: HomePage;
  private readonly loginPanel: LoginPanel;
  private readonly overviewPage: AccountOverviewPage;

  constructor(page: Page) {
    this.page = page;
    this.homePage = new HomePage(page);
    this.loginPanel = new LoginPanel(page);
    this.overviewPage = new AccountOverviewPage(page);
  }

  /** Open the home page and submit the login form. */
  async login(username: string, password: string): Promise<void> {
    await this.homePage.open();
    await this.loginPanel.fillAndSubmit(username, password);
  }

  /** Log in with ParaBank's seeded demo customer. */
  async loginAsDemo(): Promise<void> {
    await this.login(demoCustomer.username, demoCustomer.password);
  }

  /** Log out from an authenticated session. */
  async logout(): Promise<void> {
    await this.overviewPage.menuLogOut.click();
  }

  /**
   * True when the page shows the authenticated left-hand menu.
   *
   * ParaBank renders the post-login menu only for a signed-in session, so
   * the presence of the logout link is the cheapest reliable signal.
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.overviewPage.menuLogOut.isVisible().catch(() => false);
  }

  /** The URL the browser is currently on. */
  async currentUrl(): Promise<string> {
    return this.page.url();
  }
}
