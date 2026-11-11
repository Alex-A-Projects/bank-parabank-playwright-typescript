/**
 * Loan DTOs for the API suite.
 */

export interface LoanResponse {
  responseDate?: string;
  loanProviderName?: string;
  approved: boolean;
  message?: string;
  accountId?: number;
}
