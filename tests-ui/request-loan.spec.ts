import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * Request Loan (PB-1015).
 *
 * The form behind "Request Loan" in the post-login menu: a loan amount, a
 * down payment and the account the down payment is taken from.
 *
 * The form-rendering test is read-only and runs against the seeded demo
 * customer. The loan request registers its own customer so no account of
 * the demo customer is used as the funding source.
 */
test.describe('Request Loan', () => {
  test(
    ticketTitle(Tickets.requestLoan, 'renders the loan form with the funding accounts'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-request-loan')] },
    async ({ overviewPage, requestLoanPage }) => {
      await overviewPage.menuRequestLoan.click();

      await expect(requestLoanPage.heading).toContainText(/Apply for a Loan/i);
      await expect(requestLoanPage.loanAmountInput).toBeVisible();
      await expect(requestLoanPage.downPaymentInput).toBeVisible();
      await expect(requestLoanPage.applyNowButton).toBeEnabled();

      await requestLoanPage.waitForAccountsDropToPopulate();
      expect(await requestLoanPage.fromAccountDropdown.locator('option').count()).toBeGreaterThan(0);
    },
  );

  test(
    ticketTitle(Tickets.requestLoan, 'processes and approves a $100 loan request'),
    { tag: [Tags.MUTATING, Tags.SMOKE, Tags.REGRESSION, featureTag('ui-request-loan')] },
    async ({ registeredCustomer, accountOverviewPage, requestLoanPage }) => {
      await accountOverviewPage.menuAccountOverview.waitFor({ state: 'visible' });

      await requestLoanPage.open();
      await requestLoanPage.waitForAccountsDropToPopulate();
      const [fromId] = await requestLoanPage.fromAccountDropdown.locator('option').evaluateAll(
        (nodes) => nodes.map((node) => (node as HTMLOptionElement).value).filter(Boolean),
      );
      if (!fromId) {
        throw new Error('The registered customer has no account to fund the loan from.');
      }

      await requestLoanPage.requestLoan({ amount: '100', downPayment: '10', fromId });
      await requestLoanPage.waitForResult();

      await expect(requestLoanPage.successHeading).toBeVisible();
      await expect(requestLoanPage.successHeading).toHaveText(/Loan Request Processed/i);
      expect(await requestLoanPage.getLoanStatusText()).toBe('Approved');
    },
  );
});
