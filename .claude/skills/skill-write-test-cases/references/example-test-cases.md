# Worked examples

Three cases, one per suite, in the format the table expects.

---

## A UI case

| Field | Value |
|---|---|
| Id | `TC-UI-014` |
| Suite | `ui` |
| Title | A transfer moves the money to the second account |
| Preconditions | The customer is registered and owns two accounts (`registeredCustomer`, then `accountService.openAccount('SAVINGS')`). |
| Steps | 1. Open **Transfer Funds**. 2. Choose the first account as the source and the second as the destination. 3. Enter `10.00`. 4. Submit. |
| Expected result | The page shows the heading "Transfer Complete!", and the source account's balance is 10.00 lower than it was. |
| Tags | `@smoke @regression @mutating @feature:ui-transfer-funds` |
| Ticket | `PB-1011` |
| Notes | — |

---

## An API case

| Field | Value |
|---|---|
| Id | `TC-API-009` |
| Suite | `api` |
| Title | The service lists every account of the signed-in customer |
| Preconditions | The demo customer is signed in (`demoSession`). |
| Steps | 1. Call the account list operation for the session's customer id. |
| Expected result | The call succeeds (HTTP 200, no fault) and returns at least one account; every account carries a positive id, the customer's id and a type of `CHECKING`, `SAVINGS` or `LOAN`. |
| Tags | `@smoke @regression @feature:api-account` |
| Ticket | `PB-2003` |
| Notes | The assertion is transport-agnostic: it holds over SOAP and over both REST serialisations. |

---

## A database case

| Field | Value |
|---|---|
| Id | `TC-DB-006` |
| Suite | `db` |
| Title | Opening a savings account takes the minimum deposit out of the paying account |
| Preconditions | The customer is registered (`registeredCustomer`) and owns a checking account with 515.50. |
| Steps | 1. Open a savings account through the application (`appDriver.openAccount`). |
| Expected result | The paying account holds 415.50 and the new savings account holds 100.00; the new row's `CUSTOMER_ID` is the customer's id and its `TYPE` is `1`. |
| Tags | `@regression @feature:db-account` |
| Ticket | `PB-3002` |
| Notes | The write goes through the application and the read through JDBC. The minimum deposit of 100.00 was read off the running database, not assumed. |

---

## A case that has to be split

A single idea — "a transfer changes the balance" — does not survive as one case when it is written for three suites:

| The idea | UI | API | DB |
|---|---|---|---|
| A transfer moves the money | the form reports "Transfer Complete!" | the service answers "Successfully transferred $50 …" | the source row is debited and the destination row is credited |

Each proves a different layer. The UI case proves the screen, the API case proves the contract, the database case proves the storage. Three cases, three ticket ids, three suites — and the database one can only run against the local container.

---

## A case that is not ready

| Field | Value |
|---|---|
| Id | `TC-DB-011` |
| Suite | `db` |
| Title | The stored transaction type matches the type the service reports |
| Preconditions | The customer is registered and has made a transfer. |
| Steps | 1. Read the transaction rows of the source account over JDBC. 2. Read the same account's transactions through the service. |
| Expected result | Every row's stored type maps to the name the service reports — `0` to `Credit`, `1` to `Debit`. |
| Tags | `@regression @feature:db-integration` |
| Ticket | `PB-3004` |
| Notes | `TODO(confirm):` the ordinal-to-name mapping was read off the running database by comparing the same rows through both channels. Confirm it once more against the build the pipeline runs before the assertion is written. |
