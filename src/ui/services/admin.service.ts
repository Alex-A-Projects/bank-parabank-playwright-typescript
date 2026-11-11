import { Page } from '@playwright/test';
import { AdminPage } from '../pages/AdminPage';
import type { AccessMode } from '../pages/AdminPage';

export type { AccessMode };

/**
 * AdminService - demo-data lifecycle and service-mode switching.
 *
 * These operations are destructive to the demo dataset, so the service
 * exposes them explicitly and the test layer owns the decision to call
 * them.
 *
 * ZERO ASSERTIONS.
 */
export class AdminService {
  private readonly page: Page;
  private readonly adminPage: AdminPage;

  constructor(page: Page) {
    this.page = page;
    this.adminPage = new AdminPage(page);
  }

  /** Re-initialise (re-seed) the demo dataset. */
  async initializeDemoData(): Promise<void> {
    await this.adminPage.open();
    await this.adminPage.initializeDemoData();
  }

  /** Switch the JDBC access mode from the admin page. */
  async selectAccessMode(mode: AccessMode): Promise<void> {
    await this.adminPage.open();
    await this.adminPage.selectAccessMode(mode);
  }

  /** The access mode currently selected on the admin page. */
  async getSelectedAccessMode(): Promise<string | null> {
    await this.adminPage.open();
    return await this.adminPage.getSelectedAccessMode();
  }

  /** The JMS loan-provider mode currently selected on the admin page. */
  async getSelectedJmsMode(): Promise<string | null> {
    await this.adminPage.open();
    const selected = this.adminPage.jmsModeDropdown.locator('option:checked').first();
    return await selected.getAttribute('value').catch(() => null);
  }
}
