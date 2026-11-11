/**
 * Ticket registry.
 *
 * ParaBank has no real ticket system, so the suite uses a stable
 * convention instead of inventing one:
 *
 *   - `PB-1xxx` — UI features
 *   - `PB-2xxx` — API features
 *   - `PB-3xxx` — database features
 *
 * Every test title is prefixed with one of these so a failure in a report
 * maps back to a feature area. The mapping below is the single source of
 * truth; the ticket-prefix helper is derived from it.
 */

/** Ticket id per feature area. */
export const Tickets = {
  // ---- UI -------------------------------------------------------------
  home: 'PB-1001',
  about: 'PB-1002',
  contact: 'PB-1003',
  login: 'PB-1004',
  logout: 'PB-1005',
  forgotLogin: 'PB-1006',
  register: 'PB-1007',
  accountOverview: 'PB-1008',
  accountDetails: 'PB-1009',
  openAccount: 'PB-1010',
  transferFunds: 'PB-1011',
  billPay: 'PB-1012',
  findTransactions: 'PB-1013',
  updateContactInfo: 'PB-1014',
  requestLoan: 'PB-1015',
  admin: 'PB-1016',
  navigation: 'PB-1017',

  // ---- API ------------------------------------------------------------
  apiAuth: 'PB-2001',
  apiCustomer: 'PB-2002',
  apiAccount: 'PB-2003',
  apiTransaction: 'PB-2004',
  apiMoneyMovement: 'PB-2005',
  apiStocks: 'PB-2006',
  apiJms: 'PB-2007',
  apiDbLifecycle: 'PB-2008',

  // ---- Database -------------------------------------------------------
  dbCustomer: 'PB-3001',
  dbAccount: 'PB-3002',
  dbTransaction: 'PB-3003',
  dbIntegration: 'PB-3004',
} as const;

export type Ticket = (typeof Tickets)[keyof typeof Tickets];

/**
 * Builds a test title of the form `PB-1234 | what is verified`.
 *
 * @param ticket  a ticket id from {@link Tickets}
 * @param summary what the test proves
 */
export function ticketTitle(ticket: Ticket, summary: string): string {
  return `${ticket} | ${summary}`;
}
