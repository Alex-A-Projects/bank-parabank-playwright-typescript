# The layer rules

## The chain

```
spec (tests-db/*.spec.ts)
  → fixtures (src/db/fixtures/)
    → Repositories / Factories / App Driver (src/db/repositories, factories, drivers)
      → JDBC → HSQLDB
```

## What each layer may do

| Layer | May | May not |
|---|---|---|
| **Spec** | Assert on rows and on the application's answers | Build SQL, parse the helper's raw output, insert into a table |
| **Fixture** | Register a customer, open an account, hand the spec the rows | Assert, share state between tests |
| **Repository** | Run a query, map the rows to models | Assert, decide what a good row is |
| **Factory** | Build rows and payloads | Assert |
| **App Driver** | Call the running application | Assert, touch the database directly |

## The zero-assertion rule

No `expect()` in a repository, a factory or the driver. They report what the database said; the spec decides whether it is right.

```ts
// Wrong.
async findByCustomer(customerId: number): Promise<DbAccount[]> {
  const rows = await this.db.exec('accounts-by-customer', [String(customerId)]);
  expect(rows.length).toBeGreaterThan(0);
  return ...;
}

// Right.
async findByCustomer(customerId: number): Promise<DbAccount[]> {
  const output = await this.db.exec('accounts-by-customer', [String(customerId)]);
  return dbRowFactory.rows(output).map(...).filter(...);
}
```

A repository returns `null` for a lookup that found nothing. It does not throw, and it does not assert — the spec turns "not found" into a failure if that is what the test is about.

## No direct database writes

A database test **writes through the application**:

- registration through the real registration form,
- account opening through `createAccount`,
- money movement through `transfer`.

An `INSERT` would prove that the SQL works, not that the application stores what it claims to store. That is the whole point of this suite.

## The two questions a database test asks

1. **Did the write land?** The application's write is visible in the rows.
2. **Does the application agree with the database?** What the service reports and what the database holds are the same thing.

The second question is the `db-integration` feature. It reads the same data twice — once through JDBC, once through the REST endpoints — and compares.

## Cross-suite isolation

A DB spec imports from `src/db/` and `src/shared/` only. It never reaches into `src/ui/` or `src/api/`.

## The fixture barrel

```ts
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/db/fixtures';
```

Never `import { test } from '@playwright/test'` — that bypasses the tag gate and with it the local-only rule. The database suite writes to the application, so it must never be able to run against the shared demo.
