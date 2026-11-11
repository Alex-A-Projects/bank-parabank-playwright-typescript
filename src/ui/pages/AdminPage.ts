import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The four access modes ParaBank's admin page exposes for the JDBC
 * service layer. These are the radio buttons' own `value` attributes.
 */
export type AccessMode = 'soap' | 'restxml' | 'restjson' | 'jdbc';

/**
 * AdminPage - /parabank/admin.htm
 *
 * Lets you toggle JMS and JDBC service mode and reset the demo database
 * from the standard admin link in the header. JMS uses a dropdown, JDBC
 * uses radio buttons; RESET is a submit button with action=CLEAN.
 */
export class AdminPage extends BasePage {
  readonly heading: Locator;
  readonly jmsModeDropdown: Locator;
  readonly jdbcRadioSoap: Locator;
  readonly jdbcRadioRestXml: Locator;
  readonly jdbcRadioRestJson: Locator;
  readonly jdbcRadioJdbc: Locator;
  readonly submitButton: Locator;
  readonly initButton: Locator;
  readonly cleanButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator('#rightPanel h1.title').first();
    this.jmsModeDropdown = page.locator('select#loanProvider, select[name="loanProvider"]');
    this.jdbcRadioSoap = page.locator('input#accessMode1');
    this.jdbcRadioRestXml = page.locator('input#accessMode2');
    this.jdbcRadioRestJson = page.locator('input#accessMode3');
    this.jdbcRadioJdbc = page.locator('input#accessMode4');
    this.submitButton = page.locator('input[value="Submit"]');
    this.initButton = page.locator('button[name="action"][value="INIT"]');
    this.cleanButton = page.locator('button[name="action"][value="CLEAN"]');
    this.resetButton = this.cleanButton;
  }

  async open(): Promise<void> {
    await this.goto('/admin.htm');
  }

  /**
   * Re-initialise the demo dataset.
   *
   * This is ParaBank's own seeding mechanism — the application creates
   * and repopulates its schema, so there is no separate migration step.
   */
  async initializeDemoData(): Promise<void> {
    await this.initButton.click();
    await this.page.waitForLoadState('load');
  }

  /** Select a JDBC access mode by its radio-button value. */
  async selectAccessMode(mode: AccessMode): Promise<void> {
    const radio =
      mode === 'soap'
        ? this.jdbcRadioSoap
        : mode === 'restxml'
          ? this.jdbcRadioRestXml
          : mode === 'restjson'
            ? this.jdbcRadioRestJson
            : this.jdbcRadioJdbc;
    await radio.check();
  }

  /** The currently selected JDBC access mode, read from the DOM. */
  async getSelectedAccessMode(): Promise<string | null> {
    const checked = this.page.locator('input[name="accessMode"]:checked');
    return await checked.first().getAttribute('value');
  }
}
