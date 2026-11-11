import { test as base } from '@playwright/test';
import { coreFixtures } from './core.fixture';
import type { DbCoreFixtures } from './core.fixture';
import { dbClientFixtures } from './db.fixture';
import type { DbClientFixtures } from './db.fixture';
import { flowFixtures } from './flows.fixture';
import type { DbFlowFixtures } from './flows.fixture';

/**
 * Database fixture composition root.
 *
 * The fixture type is assembled in dependency order - core -> client ->
 * flows - and every database spec imports `test` and `expect` from here
 * and nowhere else.
 */
type DbFixtures = DbCoreFixtures & DbClientFixtures & DbFlowFixtures;

export const test = base.extend<DbFixtures>({
  ...coreFixtures,
  ...dbClientFixtures,
  ...flowFixtures,
});

export { expect } from '@playwright/test';

/**
 * The models and shared vocabulary a database spec needs.
 *
 * Re-exported here so that a spec imports from ONE place - its own
 * suite's fixture barrel - and never reaches into the layer tree.
 */
export { accountTypeName, DbAccountType } from '../models';
export type { DbAccount, DbAccountTypeName, DbCustomer, DbTransaction } from '../models';
export { transactionTypeName, DbTransactionType } from '../models';
export { AccountTypeCode, AccountTypeNames } from '../../shared/account-types';
export type { AccountTypeCodeValue } from '../../shared/account-types';
export { customerFactory, CustomerBuilder } from '../../shared/factories';
export type { CustomerPayload } from '../../shared/factories';
export { Tags, featureTag } from '../../shared/tags';
export { ticketTitle, Tickets } from '../../shared/tickets';
