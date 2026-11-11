# Feature gating guide

Which tests run where, and why one of them was skipped.

---

## The short version

Three rules decide whether a test runs:

1. **The environment axis** — where the suite points.
2. **The feature matrix** — whether the feature is enabled in that
   environment.
3. **The mutating rule** — whether the test changes data, and whether the
   target is shared.

All three are applied by an automatic fixture before the test body runs.

---

## The two axes

| Variable | Drives | Default |
|---|---|---|
| `TEST_ENV` | Browser navigation **and** the database target | `cloud` |
| `API_ENV` | The API clients and API fixtures only | falls back to `TEST_ENV` |

Both take `cloud` or `local`.

- **cloud** — the public demo at `parabank.parasoft.com`. Shared by
  everybody. Rate limited. **Never written to.**
- **local** — the Dockerised ParaBank container on `localhost:8080`.

They are independent on purpose. `TEST_ENV=local API_ENV=cloud` is a valid
run: the browser drives the container while the API suite talks to the
demo. The suite does not warn about the mismatch beyond exposing
`appConfig.axesDiffer` — the combination is sometimes exactly what you
want.

**Which axis gates which suite:**

| Suite | Gates on |
|---|---|
| UI | `TEST_ENV` |
| API | `API_ENV` |
| DB | `TEST_ENV` |

---

## The feature matrix

`config/test-policy.json` is the single source of truth:

```json
{
  "envs": {
    "cloud": { "features": { "ui-home": true, "db-customer": false } },
    "local": { "features": { "ui-home": true, "db-customer": true } }
  }
}
```

A feature name is the same string the tag carries, minus the
`@feature:` prefix. `featureTag('db-customer')` → `@feature:db-customer`.

### The features

| Feature | cloud | local |
|---|:---:|:---:|
| `ui-home` … `ui-navigation` (17 UI features) | ✅ | ✅ |
| `api-auth` `api-customer` `api-account` `api-transaction` `api-money-movement` `api-stocks` `api-jms` | ✅ | ✅ |
| `api-db-lifecycle` | ❌ | ✅ |
| `db-customer` `db-account` `db-transaction` `db-integration` | ❌ | ✅ |

### Why the two groups are cloud-disabled

- **`db-*`** — the public demo does not expose its HSQLDB port. The JDBC
  bridge cannot connect there at all; the feature is off rather than
  failing.
- **`api-db-lifecycle`** — `initializeDB` and `cleanDB` wipe and re-seed the
  shared dataset. Doing that on the demo would destroy every other
  user's data.

---

## The two failure modes

They are deliberately different.

### A disabled feature → **skip**, with the reason

```
skipped
  feature "db-customer" is disabled in environment "cloud"
```

The test is in the report as *skipped*, not as *failed* and not as *passed*.
A skipped test is a fact about the environment, not about the product.

### An unknown feature → **fail loudly**

```
Error: Unknown feature "db-customerz" (from tag "@feature:db-customerz").
Add it to config/test-policy.json under the "cloud" environment before
using it in a test. Known features: api-account, api-auth, …
```

A typo must never become a test that silently never runs. The same
principle applies to selection tags: an unknown tag throws rather than
producing a tag that no `--grep` will ever match.

---

## The mutating rule

A test that changes data — registers a customer, opens an account, moves
money, pays a bill, resets the database — carries the marker tag
`Tags.MUTATING`.

**A mutating test only runs against `local`.**

```ts
mutating tests run against the local container only - environment "cloud" is shared
```

This is a separate rule from the matrix, because it is about what a test
*does*, not which feature it covers. The matrix could not express it: a
feature is enabled in an environment, but a *behaviour* is not.

### It is enforced, not documented

The rule lives in `mutatingTestSkipReason()` in `src/shared/policy.ts`, and
that function is wired into the automatic tag gate of **every** suite:

```ts
const reason =
  featureGateSkipReason(testInfo.tags, TEST_ENV) ??
  mutatingTestSkipReason(testInfo.tags, TEST_ENV);
if (reason) {
  testInfo.skip(true, reason);
}
```

The gate is an automatic fixture on the composition root. A spec cannot
bypass it by importing `test` from `@playwright/test` directly — which is
one more reason every spec imports `test` from its own suite's fixture
barrel:

```ts
// Right — the gate applies.
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

// Wrong — no gate, no policy, no local-only protection.
import { test, expect } from '@playwright/test';
```

---

## The tag axes

Two composable axes, plus one marker.

### Selection tags

For choosing what to run. They never gate execution.

```ts
Tags.SMOKE          // @smoke
Tags.SANITY         // @sanity
Tags.REGRESSION     // @regression
Tags.NEGATIVE       // @negative
Tags.BOUNDARY       // @boundary
Tags.E2E            // @e2e
Tags.SECURITY       // @security
Tags.ACCESSIBILITY  // @accessibility
Tags.CRITICAL       // @critical
Tags.MUTATING       // @mutating — a marker, not a selection
```

### Feature tags

Produced by `featureTag(name)` → `@feature:<name>`. These are what the
matrix matches.

```ts
test(
  ticketTitle(Tickets.transferFunds, 'confirms a transfer between two of the customer accounts'),
  { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-transfer-funds')] },
  async ({ transferFundsPage }) => { … },
);
```

A `describe` block may carry the feature tag; the tests inside inherit it.

---

## Running a subset

```bash
# By selection tag
npx playwright test --config=playwright.ui.config.ts --grep @smoke

# By feature tag
npx playwright test --config=playwright.api.config.ts --grep @feature:api-account

# Mutating tests only, against the container
TEST_ENV=local npx playwright test --config=playwright.ui.config.ts --grep @mutating

# Skip a group
npx playwright test --config=playwright.ui.config.ts --grep-invert @mutating
```

---

## Changing the matrix

1. Add the feature to **every** environment in `config/test-policy.json` —
   a feature that exists for `local` but not for `cloud` is read as
   "disabled on cloud", not as "unknown", and the difference matters.
2. Tag the test with `featureTag('<name>')`.
3. Run the suite in both environments to see the skip reason.

Adding a feature that only ever runs locally is fine and intentional — the
`db-*` features are exactly that.
