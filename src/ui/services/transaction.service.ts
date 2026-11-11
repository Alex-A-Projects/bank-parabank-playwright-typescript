import { Page } from '@playwright/test';
import { FindTransactionsPage } from '../pages/FindTransactionsPage';
import { TransactionRow } from '../models';

/**
 * TransactionService - transaction-search workflows for the UI suite.
 *
 * ZERO ASSERTIONS - the service returns the rows it found; the test layer
 * decides whether that is the expected result set.
 */
export class TransactionService {
  private readonly page: Page;
  private readonly findTransactionsPage: FindTransactionsPage;

  constructor(page: Page) {
    this.page = page;
    this.findTransactionsPage = new FindTransactionsPage(page);
  }

  /** Open the "Find Transactions" page and wait for the account dropdown. */
  async open(): Promise<void> {
    await this.findTransactionsPage.open();
    await this.findTransactionsPage.waitForAccountsDropToPopulate();
  }

  /** Search by exact amount and return the rows rendered. */
  async findByAmount(opts: { fromId: string; amount: string }): Promise<TransactionRow[]> {
    await this.open();
    await this.findTransactionsPage.searchByAmount(opts);
    await this.findTransactionsPage.waitForResults();
    return await this.findTransactionsPage.getResultRows();
  }

  /** Search by a date range and return the rows rendered. */
  async findByDateRange(opts: {
    fromId: string;
    from: string;
    to: string;
  }): Promise<TransactionRow[]> {
    await this.open();
    await this.findTransactionsPage.searchByDateRange(opts);
    await this.findTransactionsPage.waitForResults();
    return await this.findTransactionsPage.getResultRows();
  }

  /** Search by an exact date and return the rows rendered. */
  async findByDate(opts: { fromId: string; date: string }): Promise<TransactionRow[]> {
    await this.open();
    await this.findTransactionsPage.searchByExactDate(opts);
    await this.findTransactionsPage.waitForResults();
    return await this.findTransactionsPage.getResultRows();
  }

  /** Search by transaction id and return the rows rendered. */
  async findById(opts: { fromId: string; transactionId: string }): Promise<TransactionRow[]> {
    await this.open();
    await this.findTransactionsPage.searchById(opts);
    await this.findTransactionsPage.waitForResults();
    return await this.findTransactionsPage.getResultRows();
  }
}
