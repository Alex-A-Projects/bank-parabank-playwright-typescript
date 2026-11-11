# The JDBC bridge

## Why a Java helper

Node has no JDBC driver, and shipping a native one would add a platform-specific dependency for a read-only use case. Instead the suite compiles a small Java helper and runs it as a child process.

```
src/db/client/jdbc/DbQuery.java     the helper - the only place SQL appears
src/db/client/jdbc/hsqldb-2.7.4.jar  the driver, committed
src/db/client/db-client.ts           the bridge - compiles, runs, returns stdout
```

## How it works

1. `DbClient.exec(mode, args)` checks whether the `.class` file is missing or older than the `.java` source, and compiles it on demand with `javac`.
2. It runs `java -cp <driver>:<jdbcDir> DbQuery <mode> <args…>`.
3. It returns the helper's stdout.

Compiling on demand keeps the repository free of a build step while still making an edited helper take effect immediately. The compiled `.class` is git-ignored.

## The connection details never appear on the command line

```ts
env: {
  ...process.env,
  DB_JDBC_URL: dbConfig.jdbcUrl,
  DB_USER: dbConfig.user,
  DB_PASSWORD: dbConfig.password,
}
```

The JDBC URL, the user and the password travel through the child's **environment**, never as arguments — otherwise they would show up in a process listing. They come from `process.env` in the first place; there is no fallback value in the code.

## The wire format

The helper prints one row per line, fields separated by `|`, in column order:

```
12345|12212|0|-2300.0000
```

`dbRowFactory` turns that into the models. The factory maps; it does not judge. A row with the wrong number of fields produces `null` rather than a half-filled model.

## The query modes

| Mode | Returns |
|---|---|
| `customer-by-username` | one `CUSTOMER` row |
| `customer-by-id` | one `CUSTOMER` row |
| `customer-count` | a number |
| `customer-exists-username` | `true` / `false` |
| `account-by-id` | one `ACCOUNT` row |
| `accounts-by-customer` | every `ACCOUNT` row of a customer, ordered by id |
| `account-count-by-customer` | a number |
| `account-balance` | a number |
| `transaction-by-id` | one `TRANSACTION` row |
| `transactions-by-account` | every transaction of an account, ordered by id |
| `transactions-by-customer` | every transaction across the customer's accounts |
| `transaction-count-by-account` | a number |
| `transaction-count-by-customer` | a number |
| `transfer-exists` | `true` / `false` |
| `loan-payment-exists` | `true` / `false` |
| `loan-account-exists` | `true` / `false` |
| `loan-accounts-by-customer` | a number |

## Adding a query mode

1. Add the case to the helper's `switch`, with the SQL in **one** place — the helper. No SQL anywhere else in the repository.
2. Use a `PreparedStatement` with `?` placeholders. Never concatenate a value into the SQL; the arguments are parsed as integers in the helper.
3. Add the mode to `DbClient`'s callers — usually a method on a repository.
4. Map the new shape in `dbRowFactory`.
5. **Never** write to the database from the helper. The helper reads. The application writes.

## The cost

Every query starts a JVM. That is why the database suite has a generous timeout (120 s) and a single worker, and why the suite reads as few rows as it can: one call for everything the test needs, not one call per assertion.
