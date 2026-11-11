/**
 * Stock-position DTOs for the API suite.
 */

export interface Position {
  positionId: number;
  customerId: number;
  name?: string;
  symbol?: string;
  shares: number;
  purchasePrice: number;
}

/** One point of a position's price history. */
export interface HistoryPoint {
  symbol?: string;
  date?: string;
  closingPrice?: number;
}
