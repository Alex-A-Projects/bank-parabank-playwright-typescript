import { Page } from '@playwright/test';
import { AccountOverviewPage } from '../pages/AccountOverviewPage';
import { OpenAccountPage } from '../pages/OpenAccountPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { AccountSummary, OpenableAccountType } from '../models';

/**
 * AccountService - account-facing workflows for the UI suite.
 *
 * ZERO ASSERTIONS - every method reports what it observed and lets the
 * test layer decide whether that is correct.
 */
export class AccountService {
  private readonly page: Page;
  private readonly overviewPage: AccountOverviewPage;
  private readonly openAccountPage: OpenAccountPage;
  private readonly transferFundsPage: TransferFundsPage;

  constructor(page: Page) {
    this.page = page;
    this.overviewPage = new AccountOverviewPage(page);
    this.openAccountPage = new OpenAccountPage(page);
    this.transferFundsPage = new TransferFundsPage(page);
  }

  /** The accounts currently listed on the overview page. */
  async listAccounts(): Promise<AccountSummary[]> {
    await this.overviewPage.open();
    await this.overviewPage.waitForAccountsToLoad();
    return await this.overviewPage.getAccountRows();
  }

  /** The total balance as rendered in the accounts table. */
  async getTotalBalance(): Promise<string> {
    return await this.overviewPage.getTotalBalance();
  }

  /** The account ids offered by the transfer form. */
  async getTransferAccountIds(): Promise<string[]> {
    await this.transferFundsPage.open();
    await this.transferFundsPage.waitForAccountsDropToPopulate();
    return await this.transferFundsPage.getFromAccountIds();
  }

  /** Open an additional account of the given type. */
  async openAccount(type: OpenableAccountType, fromAccountId?: string): Promise<void> {
    await this.openAccountPage.open();
    await this.openAccountPage.waitForAccountsDropToPopulate();
    await this.openAccountPage.openAccount(type, fromAccountId);
    await this.openAccountPage.waitForResult();
  }

  /** Move funds between two of the customer's own accounts. */
  async transferFunds(opts: { amount: string; fromId: string; toId: string }): Promise<void> {
    await this.transferFundsPage.open();
    await this.transferFundsPage.waitForAccountsDropToPopulate();
    await this.transferFundsPage.transferFunds(opts);
    await this.transferFundsPage.waitForResult();
  }

  /** Open the account overview page. */
  async openOverview(): Promise<void> {
    await this.overviewPage.open();
  }
}
