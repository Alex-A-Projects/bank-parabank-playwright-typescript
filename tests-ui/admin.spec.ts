import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';
import { baseURL } from '../src/shared/env';
import type { Page } from '@playwright/test';

/**
 * Set by the dataset-control tests. ParaBank's INIT and CLEAN buttons
 * replace the contents of the whole server database, so the seeded demo
 * data has to be put back before the rest of the suite runs.
 */
let sharedDatasetWasMutated = false;

/**
 * Waits until the instance serves requests again.
 *
 * CLEAN and INIT replace the contents of the whole database, and the
 * application is busy re-creating its schema while that happens. A
 * navigation that starts in that window can take longer than the
 * default action timeout, so the destructive tests wait for the instance
 * to answer before they hand the suite back.
 *
 * The wait is a poll on the condition - the instance answers - and not a
 * fixed sleep.
 */
async function waitForInstance(page: Page): Promise<void> {
  await expect(async () => {
    const response = await page.request.get(`${baseURL}/index.htm`, { timeout: 10_000 });
    expect(response.status()).toBe(200);
  }).toPass({ timeout: 60_000, intervals: [500, 1000, 2000, 5000] });
}

/**
 * Administration (PB-1016).
 *
 * The page behind the "Admin Page" link in the global header. It exposes
 * the data-access mode of the service layer, the endpoints the services
 * talk to, and the two controls that (re-)create and clear the demo
 * database.
 *
 * The dataset controls are DESTRUCTIVE: they change the state of the
 * server for everybody using it, not just for this browser session. They
 * are kept - and tagged `@regression` - but a run that only wants the
 * read-only coverage should leave them out.
 */
test.describe('Administration', () => {
  test(
    ticketTitle(Tickets.admin, 'is reachable from the Admin Page link in the header'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ homePage, adminPage, page }) => {
      await homePage.open();

      await homePage.adminPageLink.click();

      await expect(page).toHaveURL(/admin\.htm/);
      await expect(adminPage.heading).toContainText(/Administration/i);
    },
  );

  test(
    ticketTitle(Tickets.admin, 'heads the page with "Administration"'),
    { tag: [Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await expect(adminPage.heading).toContainText(/Administration/i);
    },
  );

  test(
    ticketTitle(Tickets.admin, 'shows the service mode dropdown and the dataset controls'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await expect(adminPage.jmsModeDropdown).toBeVisible();
      await expect(adminPage.initButton).toBeVisible();
      await expect(adminPage.cleanButton).toBeVisible();
      await expect(adminPage.submitButton).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'renders all four data-access modes'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await expect(adminPage.jdbcRadioSoap).toBeVisible();
      await expect(adminPage.jdbcRadioRestXml).toBeVisible();
      await expect(adminPage.jdbcRadioRestJson).toBeVisible();
      await expect(adminPage.jdbcRadioJdbc).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'selects JDBC as the default data-access mode'),
    { tag: [Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await expect(adminPage.jdbcRadioJdbc).toBeChecked();
      await expect(adminPage.jdbcRadioSoap).not.toBeChecked();
      expect(await adminPage.getSelectedAccessMode()).toBe('jdbc');
    },
  );

  test(
    ticketTitle(Tickets.admin, 'keeps JDBC selected when the radio is chosen'),
    { tag: [Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await adminPage.selectAccessMode('jdbc');

      await expect(adminPage.jdbcRadioJdbc).toBeChecked();
      await expect(adminPage.jdbcRadioSoap).not.toBeChecked();
      expect(await adminPage.getSelectedAccessMode()).toBe('jdbc');
    },
  );

  test(
    ticketTitle(Tickets.admin, 'keeps REST (JSON) selected when the radio is chosen'),
    { tag: [Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await adminPage.selectAccessMode('restjson');

      await expect(adminPage.jdbcRadioRestJson).toBeChecked();
      await expect(adminPage.jdbcRadioJdbc).not.toBeChecked();
      expect(await adminPage.getSelectedAccessMode()).toBe('restjson');
    },
  );

  test(
    ticketTitle(Tickets.admin, 'shows the INIT control as enabled'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await expect(adminPage.initButton).toBeVisible();
      await expect(adminPage.initButton).toBeEnabled();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'exposes a single CLEAN control that resets the dataset'),
    { tag: [Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      await expect(adminPage.cleanButton).toBeVisible();
      await expect(adminPage.cleanButton).toHaveAttribute('value', 'CLEAN');
      await expect(page.locator('button[name="action"][value="CLEAN"]')).toHaveCount(1);
    },
  );

  test(
    ticketTitle(Tickets.admin, 'keeps the SOAP endpoint editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      const soapEndpoint = page.locator('input[name="soapEndpoint"]');
      await expect(soapEndpoint).toBeVisible();
      await expect(soapEndpoint).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'keeps the REST endpoint editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      const restEndpoint = page.locator('input[name="restEndpoint"]');
      await expect(restEndpoint).toBeVisible();
      await expect(restEndpoint).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'keeps the LoanProcessor endpoint editable'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      const loanEndpoint = page.locator('input#endpoint, input[name="endpoint"]').first();
      await expect(loanEndpoint).toBeVisible();
      await expect(loanEndpoint).toBeEditable();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'keeps the submit button enabled'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await expect(adminPage.submitButton).toBeEnabled();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'reports the service status as "Running"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      await expect(page.locator('#rightPanel td', { hasText: 'Running' }).first()).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'titles the page "ParaBank | Administration"'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      await expect(page).toHaveTitle(/ParaBank/);
    },
  );

  test(
    ticketTitle(Tickets.admin, 'keeps the administration page URL'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      await expect(page).toHaveURL(/admin\.htm/);
    },
  );

  test(
    ticketTitle(Tickets.admin, 'shows the global ParaBank logo'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage }) => {
      await adminPage.open();

      await expect(adminPage.logoLink).toBeVisible();
    },
  );

  test(
    ticketTitle(Tickets.admin, 'keeps the customer login form available'),
    { tag: [Tags.SANITY, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // Dataset controls - destructive against the shared ParaBank instance.
  // ---------------------------------------------------------------------------

  test(
    ticketTitle(Tickets.admin, 're-seeds the shared dataset from the INIT control'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      sharedDatasetWasMutated = true;
      const datasetRequest = page.waitForResponse((response) => response.url().includes('db.htm'));
      await adminPage.initButton.click();
      const response = await datasetRequest;

      expect(response.status()).toBeLessThan(400);
      await expect(page).toHaveURL(/\/(db|admin|index)\.htm/);
      await waitForInstance(page);
    },
  );

  test(
    ticketTitle(Tickets.admin, 'clears the shared dataset from the CLEAN control'),
    { tag: [Tags.MUTATING, Tags.REGRESSION, featureTag('ui-admin')] },
    async ({ adminPage, page }) => {
      await adminPage.open();

      sharedDatasetWasMutated = true;
      const datasetRequest = page.waitForResponse((response) => response.url().includes('db.htm'));
      await adminPage.cleanButton.click();
      const response = await datasetRequest;

      expect(response.status()).toBeLessThan(400);
      await expect(page).toHaveURL(/\/(db|admin|index)\.htm/);
      await waitForInstance(page);
    },
  );
});

test.afterAll(async ({ browser }) => {
  if (!sharedDatasetWasMutated) {
    return;
  }

  // The dataset controls above replaced the contents of the shared database.
  // Put the seeded demo data back so the suites that sign in as the demo
  // customer still find it.
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/admin.htm`, { waitUntil: 'load' });
    await page.click('button[name="action"][value="INIT"]');
    await page.waitForLoadState('load');
    await waitForInstance(page);
  } catch (error) {
    console.warn(`[ui-admin] the seeded demo dataset could not be restored: ${String(error)}`);
  } finally {
    await context.close();
  }
});
