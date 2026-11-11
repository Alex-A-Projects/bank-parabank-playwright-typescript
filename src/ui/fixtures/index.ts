import { test as base } from '@playwright/test';
import { coreFixtures } from './core.fixture';
import type { CoreFixtures } from './core.fixture';
import { pagesFixtures } from './pages.fixture';
import type { PagesFixtures } from './pages.fixture';
import { flowFixtures } from './flows.fixture';
import type { FlowFixtures } from './flows.fixture';

/**
 * UI fixture composition root.
 *
 * The fixture type is assembled in dependency order - core -> pages ->
 * flows - and each layer's individual named fixtures are spread in
 * directly (no per-layer wrapper objects). Every UI spec imports `test`
 * and `expect` from here and nowhere else.
 */
type UiFixtures = CoreFixtures & PagesFixtures & FlowFixtures;

export const test = base.extend<UiFixtures>({
  ...coreFixtures,
  ...pagesFixtures,
  ...flowFixtures,
});

export { expect } from '@playwright/test';

export { Tags, featureTag } from '../../shared/tags';
export { ticketTitle, Tickets } from '../../shared/tickets';
