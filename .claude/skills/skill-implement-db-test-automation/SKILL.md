---
name: skill-implement-db-test-automation
description: >
  Implement Playwright + TypeScript database tests for the ParaBank suite.
  Use when writing or changing anything under tests-db/ or src/db/ —
  covers the JDBC bridge, the repository and factory layers, the write
  path through the running application, the isolation strategy and the
  confirmed schema facts.
---

# Implementing database tests

Everything the database suite needs to know about how this repository
proves that a write really landed.

## Start here

| Read | When |
|---|---|
| [`references/layer-rules.md`](references/layer-rules.md) | Before writing anything — the layer contract and the zero-assertion rule. |
| [`references/jdbc-bridge.md`](references/jdbc-bridge.md) | When working with the client, the helper or a new query mode. |
| [`references/write-path-and-isolation.md`](references/write-path-and-isolation.md) | When a test needs to change data, or when you are deciding what a test may assert on. |
| [`references/confirmed-schema-facts.md`](references/confirmed-schema-facts.md) | Before you assert on a column, an ordinal or a stored value. |
| [`references/authoring-checklist.md`](references/authoring-checklist.md) | Before you report a test as done. |

## The shape of a database test

Two halves, both in the test:

- **Write through the application** — the registration form, `createAccount`, `transfer`. Never `INSERT` into a table: that proves nothing about the application.
- **Read through JDBC** — the repository layer over the Java helper in `src/db/client/jdbc/`.

```ts
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/db/fixtures';

test(
  ticketTitle(Tickets.dbAccount, 'links the opened account to the customer that opened it'),
  { tag: [Tags.REGRESSION, featureTag('db-account')] },
  async ({ registeredCustomer, savingsAccount }) => {
    expect(savingsAccount.savings.customerId).toBe(registeredCustomer.customer.id);
  },
);
```

- **Title** — `PB-3xxx | what is verified`.
- **Tags** — at least one selection tag, plus `featureTag('db-<feature>')`.
- **Fixtures** — `registeredCustomer`, `savingsAccount`, the repositories and `appDriver`, all from the barrel.
- **Assertions** — `expect()` in the spec, on the rows the repository returned.

## Isolation

**Per-test unique-user scoping.** Every test registers its own customer with a unique username and asserts only on that customer's rows. Nothing is shared between tests; nothing is truncated; the seeded demo dataset is never wiped.

Truncate-and-reseed is not available: the database lives inside the application container, the application holds its own connections, and a wipe would destroy the data the UI and API suites depend on.

## The suite is local-only

The public demo does not expose its HSQLDB port, so every `db-*` feature is disabled for `cloud` in `config/test-policy.json`. Run it with:

```bash
npm run db:up
npm run test:db      # the script sets TEST_ENV=local
```

## Facts you may not invent

Never fabricate a table, a column, an ordinal or a value. Everything must be traceable to the schema the application creates, to an observed row, or to the live WSDL/WADL. If the ordinal behind a stored code is not confirmed, leave a `TODO(confirm):` and report it.

## Verify before reporting

```bash
npm run typecheck
npm run test:db
```

A test is not done because it compiles. Run it and see it pass.
