import { test as base } from '@playwright/test';
import { coreFixtures } from './core.fixture';
import type { ApiCoreFixtures } from './core.fixture';
import { apiClientFixtures } from './api.fixture';
import type { ApiClientFixtures } from './api.fixture';
import { flowFixtures } from './flows.fixture';
import type { ApiFlowFixtures } from './flows.fixture';

/**
 * API fixture composition root.
 *
 * The fixture type is assembled in dependency order - core -> clients ->
 * flows - and each layer's individual named fixtures are spread in
 * directly (no per-layer wrapper objects). Every API spec imports `test`
 * and `expect` from here and nowhere else.
 */
type ApiFixtures = ApiCoreFixtures & ApiClientFixtures & ApiFlowFixtures;

export const test = base.extend<ApiFixtures>({
  ...coreFixtures,
  ...apiClientFixtures,
  ...flowFixtures,
});

export { expect } from '@playwright/test';

export { Tags, featureTag } from '../../shared/tags';
export { ticketTitle, Tickets } from '../../shared/tickets';
