import { AdminService } from './admin.service';
import { AccountService } from './account.service';
import { AuthService } from './auth.service';
import { CustomerService } from './customer.service';
import { MoneyMovementService } from './money-movement.service';
import { StocksService } from './stocks.service';
import { TransactionService } from './transaction.service';
import type { ParaBankStrategy, StrategyId } from '../strategies/parabank-strategy';

/**
 * ParaBankService - the Facade pattern for the API suite.
 *
 * A test never talks to a transport directly. It asks the facade for the
 * area it cares about:
 *
 * ```ts
 * const result = await paraBank.accounts.list(customerId);
 * ```
 *
 * Behind the facade sit one strategy (which decides SOAP / REST-JSON /
 * REST-XML) and seven services (one per functional area). Adding a
 * transport or an operation changes neither the test nor the facade.
 *
 * ZERO ASSERTIONS.
 */
export class ParaBankService {
  /** Logging in. */
  readonly auth: AuthService;
  /** Customer records. */
  readonly customers: CustomerService;
  /** Accounts. */
  readonly accounts: AccountService;
  /** Transactions. */
  readonly transactions: TransactionService;
  /** Deposits, withdrawals, transfers, loans and bills. */
  readonly money: MoneyMovementService;
  /** Stock positions. */
  readonly stocks: StocksService;
  /** Server administration. */
  readonly admin: AdminService;

  constructor(private readonly strategy: ParaBankStrategy) {
    this.auth = new AuthService(strategy);
    this.customers = new CustomerService(strategy);
    this.accounts = new AccountService(strategy);
    this.transactions = new TransactionService(strategy);
    this.money = new MoneyMovementService(strategy);
    this.stocks = new StocksService(strategy);
    this.admin = new AdminService(strategy);
  }

  /** Which transport the facade speaks. */
  get transport(): StrategyId {
    return this.strategy.id;
  }

  /** A human-readable description of the transport. */
  get transportDescription(): string {
    return this.strategy.description;
  }

  /**
   * The strategy behind the facade.
   *
   * Exposed for wire-level assertions (raw body, content type) that the
   * normalised models do not carry.
   */
  get raw(): ParaBankStrategy {
    return this.strategy;
  }
}
