import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AboutPage - the static "About Us" page.
 */
export class AboutPage extends BasePage {
  readonly bodyHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.bodyHeading = page.locator('#rightPanel h1.title').first();
  }

  async open(): Promise<void> {
    await this.goto('/about.htm');
  }

  /** The full body copy of the About page. */
  async getBodyText(): Promise<string> {
    return (await this.page.locator('#rightPanel').innerText()).trim();
  }
}
