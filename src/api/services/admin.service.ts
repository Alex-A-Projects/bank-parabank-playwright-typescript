import type { ApiResult } from '../models/api-result.model';
import type { ParaBankStrategy } from '../strategies/parabank-strategy';

/**
 * Server administration: database lifecycle, parameters and JMS listeners.
 *
 * Every operation here changes global server state, which is why the
 * policy matrix disables them outside the local environment.
 *
 * ZERO ASSERTIONS.
 */
export class AdminService {
  constructor(private readonly strategy: ParaBankStrategy) {}

  /** Reset the database to its seeded state. */
  async initializeDb(): Promise<ApiResult<void>> {
    return await this.strategy.initializeDb();
  }

  /** Empty the database. */
  async cleanDb(): Promise<ApiResult<void>> {
    return await this.strategy.cleanDb();
  }

  /** Set a server parameter. */
  async setParameter(name: string, value: string): Promise<ApiResult<void>> {
    return await this.strategy.setParameter(name, value);
  }

  /** Start the JMS listener. */
  async startupJmsListener(): Promise<ApiResult<void>> {
    return await this.strategy.startupJmsListener();
  }

  /** Stop the JMS listener. */
  async shutdownJmsListener(): Promise<ApiResult<void>> {
    return await this.strategy.shutdownJmsListener();
  }
}
