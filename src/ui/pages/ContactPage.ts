import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ContactPage - the static "Contact" page.
 */
export class ContactPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
  }

  async open(): Promise<void> {
    await this.goto('/contact.htm');
  }

  /** The full body copy of the Contact page. */
  async getBodyText(): Promise<string> {
    return (await this.page.locator('#rightPanel').innerText()).trim();
  }
}
