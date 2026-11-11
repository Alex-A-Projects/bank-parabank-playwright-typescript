# The write path and the isolation strategy

## The write path

The database suite writes **through the running application**. There is exactly one way in, and it is the way a customer uses:

| Operation | How the suite performs it |
|---|---|
| Register a customer | `GET register.htm` then `POST register.htm` — the application has no registration operation in its service API, and the form needs a session to exist before it is posted to |
| Open an account | `POST /services/bank/createAccount?customerId=…&newAccountType=<code>&fromAccountId=…` |
| Move money | `POST /services/bank/transfer?fromAccountId=…&toAccountId=…&amount=…` |
| Read the accounts back | `GET /services/bank/customers/<id>/accounts` |
| Read the transactions back | `GET /services/bank/accounts/<id>/transactions` |

The driver — `ParaBankAppDriver` in `src/db/drivers/app.driver.ts` — is the only place these routes appear. It returns `{ status, body }` and never asserts.

## Why not write to the tables directly

An `INSERT` would prove that the SQL is valid. It would prove nothing about whether the application stores what it says it stores. The whole value of this suite is that the write came from the product.

## The isolation strategy

**Per-test unique-user scoping.**

Every test registers its own customer with a unique username and asserts only on that customer's rows.

```ts
const payload = customerFactory.build();   // a unique username every time
await appDriver.register(payload);
```

Consequences:

- Tests are independent and order-agnostic. Test 7 does not care that test 3 ran first.
- Nothing is shared between tests except the read-only seeded demo data.
- The suite never truncates and never re-seeds.
- A failed test leaves its customer behind. That is the price of not wiping shared state, and it is a small one.

### Why not the alternatives

| Alternative | Why it is not used |
|---|---|
| **Transaction with rollback** | The database lives inside the application container and the application holds its own connections. A test cannot hold a transaction open across an application-side write. |
| **Truncate and re-seed** | It wipes the shared demo dataset the UI and API suites depend on, and it is slow. |
| **One shared customer for the suite** | The tests would depend on each other's order. |

## The local-only rule

The public demo does not expose its HSQLDB port, so the database suite cannot run there at all. On top of that, every `db-*` feature is disabled for `cloud` in `config/test-policy.json`, and the global setup returns immediately when every `db-*` feature is disabled.

The suite runs with `TEST_ENV=local`:

```bash
npm run db:up
npm run test:db
```

The npm script sets `TEST_ENV=local` itself, so the database suite always targets the container regardless of what `.env` says.

## The lazy schema

ParaBank creates and seeds its schema **on the first request it serves**. A freshly started container has an empty database for a moment. The global setup therefore:

1. checks that the application answers,
2. polls the database until it answers,

using `expect.poll` — a poll on a condition, not a fixed sleep.

A test that queried the database in the window before the schema existed would fail for an infrastructure reason, which is exactly what the setup prevents.

## What a test may assert on

- The rows of **its own** customer.
- The rows of the accounts that customer owns.
- The application's own answers about that customer.

Never another customer's rows, never the seeded demo customer's balance, never a global count unless the test is specifically about the count and takes its own "before" reading.
