# Spec authoring conventions

**Binding rules for every spec file in `tests-ui/`, `tests-api/` and `tests-db/`.**
These come straight from the framework brief ("Create a Playwright + TypeScript Test
Framework with Claude Code") and from the architectural decisions recorded in
`plan.md`.

---

## 1. Imports

A spec imports **only** from its own suite's fixture barrel and from `src/shared/`.
It never imports `@playwright/test` directly, never imports a page object directly
when a fixture exists for it, and never imports from another suite's `src/` tree.

```ts
// tests-ui/*.spec.ts   (the spec sits one level below the repo root)
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

// tests-api/*.spec.ts
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';

// tests-db/*.spec.ts
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/db/fixtures';
```

`src/shared/` is the ONLY cross-suite import path. A DB spec may use
`src/shared/factories`, `src/shared/tags`, `src/shared/tickets`, `src/shared/env`.

## 2. Test titles

Every title is prefixed with the ticket id of the feature area it verifies:

```ts
test(ticketTitle(Tickets.login, 'rejects an empty password'), async ({ ... }) => { ... });
```

`Tickets` lives in `src/shared/tickets.ts`:

| Suite | Ticket ids |
|---|---|
| UI | `home PB-1001`, `about PB-1002`, `contact PB-1003`, `login PB-1004`, `logout PB-1005`, `forgotLogin PB-1006`, `register PB-1007`, `accountOverview PB-1008`, `accountDetails PB-1009`, `openAccount PB-1010`, `transferFunds PB-1011`, `billPay PB-1012`, `findTransactions PB-1013`, `updateContactInfo PB-1014`, `requestLoan PB-1015`, `admin PB-1016`, `navigation PB-1017` |
| API | `apiAuth PB-2001`, `apiCustomer PB-2002`, `apiAccount PB-2003`, `apiTransaction PB-2004`, `apiMoneyMovement PB-2005`, `apiStocks PB-2006`, `apiJms PB-2007`, `apiDbLifecycle PB-2008` |
| DB | `dbCustomer PB-3001`, `dbAccount PB-3002`, `dbTransaction PB-3003`, `dbIntegration PB-3004` |

## 3. Tags

Every test carries **at least one selection tag** from `Tags`
(`@smoke @sanity @regression @negative @boundary @e2e @security @accessibility @critical`).

A test that touches a gated feature additionally carries `featureTag('<name>')`.
The feature name **must** exist in `config/test-policy.json` - an unknown feature
fails the run loudly.

```ts
test(
  ticketTitle(Tickets.login, 'rejects an empty password'),
  { tag: [Tags.NEGATIVE, featureTag('ui-login')] },
  async ({ loginPanel }) => { ... },
);
```

Feature names per suite (from `config/test-policy.json`):

- UI: `ui-home ui-about ui-contact ui-login ui-logout ui-forgot-login ui-register
  ui-account-overview ui-account-details ui-open-account ui-transfer-funds
  ui-bill-pay ui-find-transactions ui-update-contact-info ui-request-loan ui-admin
  ui-navigation`
- API: `api-auth api-customer api-account api-transaction api-money-movement
  api-stocks api-jms api-db-lifecycle`
- DB: `db-customer db-account db-transaction db-integration`

A `describe` block may carry the feature tag; a test inside inherits it.

## 4. Assertions

**Assertions live in the spec, and only in the spec.**

- Page objects, components, services, clients, repositories, factories and drivers
  expose locators and return data - they never call `expect()`.
- A spec asserts with `expect()` directly on the fixture's locators, or on a value
  a service returned.

## 5. Banned patterns

| Banned | Use instead |
|---|---|
| `waitForTimeout(...)`, `sleep(...)`, `setTimeout` in a test | `expect(locator).toBeVisible()`, `waitFor()`, `waitForResponse()`, `locator.waitFor({ state })` |
| `test.only` / `test.describe.only` | never - `forbidOnly` is on in CI |
| a hardcoded base URL (`https://parabank.parasoft.com/parabank`) | the fixture's `baseURL`, or `baseURL` from `src/shared/env` |
| a hardcoded credential | `demoCustomer` from `src/shared/env`, or `customerFactory` from `src/shared/factories` |
| `test.setTimeout(600_000)` to hide a slow step | fix the step |
| a shared mutable object between tests | a fixture that builds fresh data per test |

## 6. Test independence

Tests are order-agnostic and independent:

- anything that **mutates** customer data registers its own customer through the
  `registeredCustomer` fixture (UI suite) or writes through the app driver
  (DB suite), and asserts only on that customer's rows;
- nothing is shared between tests except immutable configuration.

## 7. Environment

Two independent axes, read from the environment:

- `TEST_ENV` - the suite environment. Drives browser navigation **and** the
  database target. The DB suite gates on this axis.
- `API_ENV` - the server environment. Drives the API clients only. The API suite
  gates on this axis.

The API suite's `appConfig` fixture exposes `testEnv`, `apiEnv`, `baseURL`,
`apiBaseURL`, `axesDiffer` and `transport`.

## 8. Style

- TypeScript strict; no `any`, no non-null `!` unless the value was just checked.
- `async/await` throughout; no `.then()` chains in specs.
- Comments explain *why*, not *what*.
- One behaviour per test. A test that needs two unrelated assertions is two tests.
