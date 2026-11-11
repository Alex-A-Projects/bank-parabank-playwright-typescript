# Database testing guide

How the database suite works, and what it found.

---

## The question this suite asks

**Did the write land, and does the application agree with the database?**

Two different questions, and the suite covers both:

| Feature | Question | File |
|---|---|---|
| `db-customer` | Did the registration write a `CUSTOMER` row? | `tests-db/customer.spec.ts` |
| `db-account` | Did the account opening write an `ACCOUNT` row, and take the deposit from the source? | `tests-db/account.spec.ts` |
| `db-transaction` | Did the transfer write the mirrored pair of `TRANSACTION` rows? | `tests-db/transaction.spec.ts` |
| `db-integration` | Does what the service reports match what the database holds? | `tests-db/integration.spec.ts` |

---

## The shape of it

```
spec (tests-db/*.spec.ts)
  → fixtures (src/db/fixtures/)
    → repositories / factories / app driver
      → JDBC bridge ──→ HSQLDB (inside the ParaBank container)
```

The suite **writes through the application** and **reads through JDBC**.

Writing directly to the tables would prove that the SQL is valid. It would
prove nothing about whether the application stores what it says it stores,
which is the entire value of this suite.

---

## Running it

```bash
npm run db:up      # start the container
npm run test:db    # 30 tests
```

`npm run test:db` sets `TEST_ENV=local` itself, so the suite always targets
the container regardless of what `.env` says.

Requirements: a JDK on the `PATH` (the helper is compiled on demand) and
the container running.

```bash
TEST_ENV=local npx playwright test --config=playwright.db.config.ts --grep @smoke
```

---

## The write path

There is exactly one way in, and it is the way a customer uses.

| Operation | How the suite performs it |
|---|---|
| Register a customer | `GET register.htm` then `POST register.htm` — the application has no registration operation in its service API, and the form needs a session to exist before it is posted to |
| Open an account | `POST /services/bank/createAccount?customerId=…&newAccountType=<code>&fromAccountId=…` |
| Move money | `POST /services/bank/transfer?fromAccountId=…&toAccountId=…&amount=…` |
| Read the accounts back | `GET /services/bank/customers/<id>/accounts` |
| Read the transactions back | `GET /services/bank/accounts/<id>/transactions` |

`ParaBankAppDriver` in `src/db/drivers/app.driver.ts` is the only place
these routes appear. It returns `{ status, body }` and never asserts.

---

## The isolation strategy

**Per-test unique-user scoping.**

Every test registers its own customer with a unique username and asserts
only on that customer's rows.

```ts
const payload = customerFactory.build();   // a unique username every time
await appDriver.register(payload);
```

Consequences:

- Tests are independent and order-agnostic. Test 7 does not care that test
  3 ran first.
- Nothing is shared between tests except the read-only seeded demo data.
- The suite never truncates and never re-seeds.
- A failed test leaves its customer behind. That is the price of not wiping
  shared state, and it is a small one.

### Why not the alternatives

| Alternative | Why it is not used |
|---|---|
| **Transaction with rollback** | The database lives inside the application container and the application holds its own connections. A test cannot hold a transaction open across an application-side write. |
| **Truncate and re-seed** | It wipes the shared demo dataset the UI and API suites depend on, and it is slow. |
| **One shared customer for the suite** | The tests would depend on each other's order. |

---

## The JDBC bridge

Node has no JDBC driver, and shipping a native one would add a
platform-specific dependency for a read-only use case. Instead the suite
compiles a small Java helper and runs it as a child process.

```
src/db/client/jdbc/DbQuery.java       the helper — the only place SQL appears
src/db/client/jdbc/hsqldb-2.7.4.jar   the driver, committed
src/db/client/db-client.ts            the bridge — compiles, runs, returns stdout
```

1. `DbClient.exec(mode, args)` compiles the helper on demand with `javac`
   if the `.class` file is missing or older than the source.
2. It runs `java -cp <driver>:<jdbcDir> DbQuery <mode> <args…>`.
3. It returns the helper's stdout.

### The credentials never appear on the command line

```ts
env: {
  ...process.env,
  DB_JDBC_URL: dbConfig.jdbcUrl,
  DB_USER: dbConfig.user,
  DB_PASSWORD: dbConfig.password,
}
```

The JDBC URL, the user and the password travel through the child's
**environment**. As arguments they would show up in a process listing. They
come from `process.env` in the first place — there is no fallback value in
the code.

### The wire format

One row per line, fields separated by `|`, in column order:

```
12345|12212|0|-2300.0000
```

`dbRowFactory` turns that into the models. The factory maps; it does not
judge. A row with the wrong number of fields produces `null` rather than a
half-filled model.

### Adding a query mode

1. Add the case to the helper's `switch` — in the helper, with
   `PreparedStatement` and `?` placeholders. **Never** concatenate a value
   into the SQL.
2. Add a method on the matching repository.
3. Map the new shape in `dbRowFactory`.
4. **Never** write to the database from the helper. The helper reads; the
   application writes.

### The cost

Every query starts a JVM. That is why the database suite has a 120-second
timeout, a single worker, and reads as few rows as it can: one call for
everything the test needs, not one call per assertion.

---

## The container

The image is pinned by its **OCI content digest**, not by a tag:

```yaml
image: parasoft/parabank@sha256:747453a0c00b52ed36c7c55aa842a6e9e4a761f70ad577ec07b1f6cbee77e0e5
```

The registry publishes only `latest`, `baseline` and `feature`, and all
three were republished on the same day — a tag would silently drift under
the suite's feet. A digest always resolves to the same bits.

### The rejected build

```
sha256:8fa644bbc7de7385b7354d6c6e8ec29dba0045e707e56226e8e85ab26369f3e2
```

This is the **newer** `latest` build — it was current when this stack was
first written. It is rejected on purpose, and the reason is worth knowing
because it is not visible until it bites:

> That build's embedded HSQLDB server refuses the handshake of its own
> bundled client — *"Network client is not a HSQLDB JDBC driver"*.

The application never initialises its schema: the seeded demo customer does
not exist and the database suite has nothing to read. The failure looks
like a product defect and is not one; it is a driver/server mismatch inside
the image. Both builds were verified against each other.

If a future build shows the same symptom, check the digest before
suspecting the suite.

### The health check

The image ships bash but neither curl nor wget, so the health check talks
to the HSQLDB server socket with bash's `/dev/tcp`:

```yaml
test:
  - CMD-SHELL
  - /bin/bash -c "exec 3<>/dev/tcp/127.0.0.1/9001 && exec 4<>/dev/tcp/127.0.0.1/8080"
```

The database is the last thing ParaBank opens, so a successful connection
means the application has finished booting.

---

## The lazy schema

**ParaBank creates and seeds its schema on the first request it serves.**
There is no migration tool and no migration file — the application owns its
schema outright.

A freshly started container therefore has an empty database for a moment.
A test that queried it in that window would fail for an infrastructure
reason, so the global setup waits:

```ts
await expect
  .poll(async () => {
    try {
      await db.exec('customer-count');
      return true;
    } catch {
      return false;
    }
  }, { timeout: 60_000, intervals: [500, 1000, 2000, 5000] })
  .toBe(true);
```

That is a poll on a condition, not a fixed sleep — it finishes as soon as
the database is ready and gives up with a clear message when it never
becomes ready.

The setup is also environment-aware: when every `db-*` feature is disabled
for the current environment — the cloud demo, which does not expose its
HSQLDB port — it returns immediately. Without that, running the unified
config against the cloud would fail on infrastructure the suite is not
going to use.

---

## The confirmed schema facts

Every fact below was read off the running database or off the live service
contract — not assumed. The full list lives in
`.claude/skills/skill-implement-db-test-automation/references/confirmed-schema-facts.md`.

### CUSTOMER

`ID`, `FIRST_NAME`, `LAST_NAME`, `ADDRESS`, `CITY`, `STATE`, `ZIP_CODE`,
`PHONE_NUMBER`, `USERNAME`. The social security number is submitted but
not selected, so the suite asserts nothing about how it is stored — a
deliberate limit.

### ACCOUNT

`ID`, `CUSTOMER_ID`, `TYPE`, `BALANCE`.

| `TYPE` | Type |
|---|---|
| `0` | `CHECKING` |
| `1` | `SAVINGS` |
| `2` | `LOAN` |

The same ordinals are what the service accepts: `createAccount` declares
`newAccountType` as `xs:int` in both the WSDL and the WADL.

### TRANSACTION

`ID`, `ACCOUNT_ID`, `TYPE`, `DATE`, `AMOUNT`, `DESCRIPTION`.

| `TYPE` | Name the service reports |
|---|---|
| `0` | `Credit` |
| `1` | `Debit` |

`DATE` is a plain date, `YYYY-MM-DD`. `AMOUNT` has four decimal places.

### The behaviours that were measured

**A new customer** — registration writes one `CUSTOMER` row and one
`ACCOUNT` row. That account is a `CHECKING` account (`TYPE = 0`) with a
balance of **515.50**, the opening deposit. It has **no** transactions: the
opening deposit is a balance, not a booked transaction.

**Opening an account** — opening an account of any type moves a minimum
deposit of **100.00** out of the paying account into the new one, whose
balance becomes **100.00**. It is booked as a pair of transactions:
`Funds Transfer Sent` on the paying account, `Funds Transfer Received` on
the new one.

The `createAccount` response reports the new account with a balance of `0`.
That is the response's own statement; the row holds `100.00`. **Assert on
the row, not on the response.**

**A transfer** — writes two rows:

| Account | Type | Description |
|---|---|---|
| The source | `DEBIT` | `Funds Transfer Sent` |
| The destination | `CREDIT` | `Funds Transfer Received` |

The balances move by the transferred amount.

**An overdraft is allowed** — ParaBank does **not** reject a transfer that
exceeds the source account's balance. The transfer succeeds and the source
balance goes negative. This was confirmed by observation, and the suite
asserts it as a boundary case. Do not write a test that expects a
rejection.

---

## What the suite does not assert

- The social security number's storage.
- The seeded demo customer's balance — it belongs to the product, not to a
  test.
- Any global row count, unless the test is specifically about the count and
  takes its own "before" reading.
- Anything not on the confirmed-facts list. If a test needs a fact that is
  not there, confirm it against the running database first; if it cannot be
  confirmed, mark it `TODO(confirm):` in the code and report it.
