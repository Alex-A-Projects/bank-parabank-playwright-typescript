import { test as base } from '@playwright/test';
import { AboutPage } from '../pages/AboutPage';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';
import { AdminPage } from '../pages/AdminPage';
import { BillPayPage } from '../pages/BillPayPage';
import { ContactPage } from '../pages/ContactPage';
import { FindTransactionsPage } from '../pages/FindTransactionsPage';
import { ForgotLoginPage } from '../pages/ForgotLoginPage';
import { HomePage } from '../pages/HomePage';
import { OpenAccountPage } from '../pages/OpenAccountPage';
import { RegisterPage } from '../pages/RegisterPage';
import { RequestLoanPage } from '../pages/RequestLoanPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { UpdateContactInfoPage } from '../pages/UpdateContactInfoPage';
import { LoginPanel } from '../components/LoginPanel';

/**
 * Page fixture layer - one fixture per Page Object.
 *
 * These fixtures are deliberately lazy: they construct the Page Object but
 * do not navigate. Navigation is an explicit, visible step in the test or
 * in the service that owns the flow.
 */
export interface PagesFixtures {
  homePage: HomePage;
  loginPanel: LoginPanel;
  aboutPage: AboutPage;
  contactPage: ContactPage;
  registerPage: RegisterPage;
  forgotLoginPage: ForgotLoginPage;
  adminPage: AdminPage;
  accountOverviewPage: AccountOverviewPage;
  openAccountPage: OpenAccountPage;
  transferFundsPage: TransferFundsPage;
  billPayPage: BillPayPage;
  findTransactionsPage: FindTransactionsPage;
  updateContactInfoPage: UpdateContactInfoPage;
  requestLoanPage: RequestLoanPage;
}

export const pagesFixtures = {
  homePage: async ({ page }, use: (value: HomePage) => Promise<void>) => {
    await use(new HomePage(page));
  },

  loginPanel: async ({ page }, use: (value: LoginPanel) => Promise<void>) => {
    await use(new LoginPanel(page));
  },

  aboutPage: async ({ page }, use: (value: AboutPage) => Promise<void>) => {
    await use(new AboutPage(page));
  },

  contactPage: async ({ page }, use: (value: ContactPage) => Promise<void>) => {
    await use(new ContactPage(page));
  },

  registerPage: async ({ page }, use: (value: RegisterPage) => Promise<void>) => {
    await use(new RegisterPage(page));
  },

  forgotLoginPage: async ({ page }, use: (value: ForgotLoginPage) => Promise<void>) => {
    await use(new ForgotLoginPage(page));
  },

  adminPage: async ({ page }, use: (value: AdminPage) => Promise<void>) => {
    await use(new AdminPage(page));
  },

  accountOverviewPage: async ({ page }, use: (value: AccountOverviewPage) => Promise<void>) => {
    await use(new AccountOverviewPage(page));
  },

  openAccountPage: async ({ page }, use: (value: OpenAccountPage) => Promise<void>) => {
    await use(new OpenAccountPage(page));
  },

  transferFundsPage: async ({ page }, use: (value: TransferFundsPage) => Promise<void>) => {
    await use(new TransferFundsPage(page));
  },

  billPayPage: async ({ page }, use: (value: BillPayPage) => Promise<void>) => {
    await use(new BillPayPage(page));
  },

  findTransactionsPage: async ({ page }, use: (value: FindTransactionsPage) => Promise<void>) => {
    await use(new FindTransactionsPage(page));
  },

  updateContactInfoPage: async ({ page }, use: (value: UpdateContactInfoPage) => Promise<void>) => {
    await use(new UpdateContactInfoPage(page));
  },

  requestLoanPage: async ({ page }, use: (value: RequestLoanPage) => Promise<void>) => {
    await use(new RequestLoanPage(page));
  },
} satisfies Parameters<typeof base.extend<PagesFixtures>>[0];
