import { Page, Locator } from '@playwright/test';
import { baseURL } from '../../shared/env';
import { gotoWithRateLimitRetry, isRateLimited } from '../../shared/navigation';

/**
 * BasePage - shared behaviour for every Page Object.
 *
 * Provides:
 *  - Navigation helpers (open, goto) with Cloudflare-aware retry.
 *  - The ParaBank global header / footer link locators, which exist on
 *    every page.
 *  - Common error-message and panel helpers.
 *
 * ZERO ASSERTIONS live in this layer. Page Objects expose locators and
 * return data; the test layer decides what is correct.
 */
export class BasePage {
  /** Canonical ParaBank base URL used by every Page Object. */
  static readonly BASE_URL = baseURL;

  readonly page: Page;

  /**
   * The base URL this POM navigates to. Defaults to the ambient
   * `TEST_ENV` base URL, but an instance can be pointed at another
   * environment (for example the local container) for its lifetime.
   */
  private baseUrl: string = baseURL;

  // Global header
  readonly logoLink: Locator;
  readonly aboutUsLink: Locator;
  readonly servicesLink: Locator;
  readonly adminPageLink: Locator;

  // Global footer
  readonly footerHomeLink: Locator;
  readonly footerAboutUsLink: Locator;
  readonly footerServicesLink: Locator;
  readonly footerSiteMapLink: Locator;
  readonly footerContactLink: Locator;
  readonly footerForumLink: Locator;

  // Panels shown on errors / notifications
  readonly errorPanel: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header - use visible-only selectors so we don't match the hidden
    // Solutions dropdown items.
    this.logoLink = page.locator('img[alt="ParaBank"]');
    this.aboutUsLink = page.locator('#headerPanel a[href*="about.htm"]:visible, #headerPanel a:has-text("About Us"):visible').first();
    this.servicesLink = page.locator('#headerPanel a[href*="services.htm"]:visible, #headerPanel a:has-text("Services"):visible').first();
    this.adminPageLink = page.locator('#headerPanel a:has-text("Admin Page")').first();

    // Footer links - text-based matches against the visible footer list.
    this.footerHomeLink = page.locator('#footerPanel a:has-text("Home")').first();
    this.footerAboutUsLink = page.locator('#footerPanel a:has-text("About Us")').first();
    this.footerServicesLink = page.locator('#footerPanel a:has-text("Services")').first();
    this.footerSiteMapLink = page.locator('#footerPanel a:has-text("Site Map")').first();
    this.footerContactLink = page.locator('#footerPanel a:has-text("Contact"):visible').first();
    this.footerForumLink = page.locator('#footerPanel a:has-text("Forum")').first();

    // Notification / error panels (right column) used after submitting forms
    this.errorPanel = page.locator('.error');
    this.title = page.locator('#rightPanel h1, .title');
  }

  /** Override the base URL for this instance. Affects all `goto()` calls on this POM. */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /** The base URL this POM currently navigates to. */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Returns true when the current page is the Cloudflare 1015 rate-limit
   * "You are being rate limited" page.
   */
  async isRateLimited(): Promise<boolean> {
    return await isRateLimited(this.page);
  }

  /**
   * Navigate to the supplied path (resolved against this POM's base URL).
   *
   * Retries on Cloudflare rate-limit (Error 1015). The wait between the
   * attempts is a poll on the condition - "the page is no longer the
   * rate-limit page" - not a fixed sleep, so a run that is not rate
   * limited is not slowed down at all.
   */
  async goto(path = ''): Promise<void> {
    const cleaned = path.startsWith('/') ? path.slice(1) : path;
    const base = this.baseUrl;
    const absolute = new URL(
      cleaned,
      base.endsWith('/') ? base : base + '/',
    ).toString();

    await gotoWithRateLimitRetry(this.page, absolute);
  }

  /** Get the current page title (the <title> tag). */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /** Get the visible page heading (the right-panel <h1>). */
  async getPageHeading(): Promise<string> {
    const heading = this.page.locator('#rightPanel h1').first();
    return (await heading.textContent())?.trim() ?? '';
  }

  /** Click the logo and return to the home page. */
  async clickLogo(): Promise<void> {
    await this.logoLink.click();
  }

  /** Returns the visible error/notification text (empty string if none). */
  async getErrorMessage(): Promise<string> {
    const err = this.errorPanel.first();
    if (await err.isVisible().catch(() => false)) {
      return ((await err.textContent()) ?? '').trim();
    }
    return '';
  }

  /** True when the ParaBank error panel is currently visible. */
  async hasError(): Promise<boolean> {
    return await this.errorPanel.first().isVisible().catch(() => false);
  }

  /**
   * Wait until a `<select>` has at least one `<option>`.
   *
   * The account dropdowns are server-rendered with the customer's
   * accounts after login, and can briefly render empty while the demo
   * data is initialising. This waits on the DOM state rather than
   * sleeping for a fixed period.
   */
  async waitForOptions(dropdown: Locator, timeoutMs = 10_000): Promise<void> {
    await dropdown
      .locator('option')
      .first()
      .waitFor({ state: 'attached', timeout: timeoutMs });
  }
}
