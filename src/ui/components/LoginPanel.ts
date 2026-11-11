import { Page, Locator } from '@playwright/test';

/**
 * LoginPanel - a reusable component wrapping the login form that ParaBank
 * renders in the right-hand panel of every unauthenticated page.
 *
 * It lives in `components/` rather than `pages/` because it is a fragment
 * that appears on several pages, not a page of its own. It extends
 * nothing: a component is not navigable, so it holds only the elements
 * and the interactions the test layer needs.
 */
export class LoginPanel {
  readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('input[value="Log In"]');
  }

  /** Fill the credentials and submit the form. */
  async fillAndSubmit(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
