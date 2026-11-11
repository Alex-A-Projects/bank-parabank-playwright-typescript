import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * The payee account number the bill payment is made to. It is test data,
 * not a credential, and ParaBank only checks that the confirmation field
 * repeats it.
 */
const PAYEE_ACCOUNT_NUMBER = '12345';

/**
 * Bill Pay (PB-1012).
 *
 * The form behind "Bill Pay" in the post-login menu: a payee, an amount
 * and the account the money leaves from.
 *
 * The form-rendering test is read-only and runs against the seeded demo
 * customer. The payment test registers its own customer so the demo
 * customer's balance is never touched.
 */
test.describe('Bill Pay', () => {
  test(
    ticketTitle(Tickets.billPay, 'renders every payee field and the funding account'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-bill-pay')] },
    async ({ overviewPage, billPayPage }) => {
      await overviewPage.menuBillPay.click();

      await expect(billPayPage.heading).toContainText(/Bill Payment Service/i);
      await expect(billPayPage.payeeNameInput).toBeVisible();
      await expect(billPayPage.addressInput).toBeVisible();
      await expect(billPayPage.cityInput).toBeVisible();
      await expect(billPayPage.stateInput).toBeVisible();
      await expect(billPayPage.zipCodeInput).toBeVisible();
      await expect(billPayPage.phoneInput).toBeVisible();
      await expect(billPayPage.accountInput).toBeVisible();
      await expect(billPayPage.verifyAccountInput).toBeVisible();
      await expect(billPayPage.amountInput).toBeVisible();
      await expect(billPayPage.sendPaymentButton).toBeEnabled();

      await billPayPage.waitForAccountsDropToPopulate();
      expect(await billPayPage.fromAccountDropdown.locator('option').count()).toBeGreaterThan(0);
    },
  );

  test(
    ticketTitle(Tickets.billPay, 'pays a bill and confirms the payment'),
    { tag: [Tags.MUTATING, Tags.SMOKE, Tags.REGRESSION, featureTag('ui-bill-pay')] },
    async ({ registeredCustomer, accountOverviewPage, billPayPage }) => {
      await accountOverviewPage.menuAccountOverview.waitFor({ state: 'visible' });

      await billPayPage.open();
      await billPayPage.waitForAccountsDropToPopulate();
      const [fromAccountId] = await billPayPage.fromAccountDropdown.locator('option').evaluateAll(
        (nodes) => nodes.map((node) => (node as HTMLOptionElement).value).filter(Boolean),
      );
      if (!fromAccountId) {
        throw new Error('The registered customer has no account to pay the bill from.');
      }

      await billPayPage.pay({
        payeeName: `${registeredCustomer.firstName} Utilities`,
        address: registeredCustomer.address,
        city: registeredCustomer.city,
        state: registeredCustomer.state,
        zipCode: registeredCustomer.zipCode,
        phone: registeredCustomer.phone,
        accountNumber: PAYEE_ACCOUNT_NUMBER,
        verifyAccount: PAYEE_ACCOUNT_NUMBER,
        amount: '5',
        fromAccountId,
      });
      await billPayPage.waitForResult();

      await expect(billPayPage.successHeading).toBeVisible();
      await expect(billPayPage.successHeading).toHaveText(/Bill Payment Complete/i);
    },
  );
});
