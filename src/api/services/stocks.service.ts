import type { ApiResult } from '../models/api-result.model';
import type { HistoryPoint, Position } from '../models/position.model';
import type { ParaBankStrategy } from '../strategies/parabank-strategy';

/**
 * Stock positions.
 *
 * ZERO ASSERTIONS.
 */
export class StocksService {
  constructor(private readonly strategy: ParaBankStrategy) {}

  /** Every position a customer holds. */
  async list(customerId: number): Promise<ApiResult<Position[]>> {
    return await this.strategy.getPositions(customerId);
  }

  /** One position by id. */
  async get(positionId: number): Promise<ApiResult<Position>> {
    return await this.strategy.getPosition(positionId);
  }

  /** The closing prices of a position over a date range. */
  async history(
    positionId: number,
    startDate: string,
    endDate: string,
  ): Promise<ApiResult<HistoryPoint[]>> {
    return await this.strategy.getPositionHistory(positionId, startDate, endDate);
  }

  /** Buy shares; the WSDL answers with the customer's positions. */
  async buy(
    customerId: number,
    accountId: number,
    name: string,
    symbol: string,
    shares: number,
    pricePerShare: string,
  ): Promise<ApiResult<Position[]>> {
    return await this.strategy.buyPosition(
      customerId,
      accountId,
      name,
      symbol,
      shares,
      pricePerShare,
    );
  }

  /** Sell shares; the WSDL answers with the customer's positions. */
  async sell(
    customerId: number,
    accountId: number,
    positionId: number,
    shares: number,
    pricePerShare: string,
  ): Promise<ApiResult<Position[]>> {
    return await this.strategy.sellPosition(
      customerId,
      accountId,
      positionId,
      shares,
      pricePerShare,
    );
  }
}
