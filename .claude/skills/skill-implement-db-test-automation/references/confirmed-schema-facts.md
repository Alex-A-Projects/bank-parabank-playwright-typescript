# Confirmed schema facts

Every fact on this page was read off the running database or off the live
service contract — not assumed. When you assert on one of them, you are
asserting something that was measured.

## CUSTOMER

| Column | Content |
|---|---|
| `ID` | The customer's id |
| `FIRST_NAME` | The submitted first name |
| `LAST_NAME` | The submitted last name |
| `ADDRESS` | The submitted street |
| `CITY` | The submitted city |
| `STATE` | The submitted state |
| `ZIP_CODE` | The submitted ZIP code |
| `PHONE_NUMBER` | The submitted phone number |
| `USERNAME` | The submitted username — the login name |

The JDBC helper selects those nine columns. The social security number is
submitted but not selected, so the suite asserts nothing about how it is
stored. That is a deliberate limit, not an oversight.

## ACCOUNT

| Column | Content |
|---|---|
| `ID` | The account's id |
| `CUSTOMER_ID` | The owning customer |
| `TYPE` | An ordinal — see below |
| `BALANCE` | A decimal with four decimal places |

### The type ordinals

| Value | Type |
|---|---|
| `0` | `CHECKING` |
| `1` | `SAVINGS` |
| `2` | `LOAN` |

The same ordinals are what the service accepts: `createAccount` declares
`newAccountType` as `xs:int` in both the WSDL and the WADL. `src/shared/account-types.ts`
holds both spellings.

## TRANSACTION

| Column | Content |
|---|---|
| `ID` | The transaction's id |
| `ACCOUNT_ID` | The account it belongs to |
| `TYPE` | An ordinal — see below |
| `DATE` | A plain date, `YYYY-MM-DD` |
| `AMOUNT` | A decimal with four decimal places |
| `DESCRIPTION` | The sentence ParaBank books |

### The type ordinals

| Value | Name the service reports |
|---|---|
| `0` | `Credit` |
| `1` | `Debit` |

Confirmed by reading the same rows through JDBC and through the service
API: the row with `TYPE = 0` is the one the API reports as `Credit`.

## The behaviours that were measured

### A new customer

- Registration writes **one** `CUSTOMER` row and **one** `ACCOUNT` row.
- That account is a `CHECKING` account (`TYPE = 0`).
- Its balance is **515.50** — the opening deposit.
- It has **no** transactions. The opening deposit is a balance, not a
  booked transaction.

### Opening an account

Opening an account of **any** type moves a minimum deposit of **100.00**:

- out of the account the customer pays from,
- into the new account, whose balance becomes **100.00**,
- booked as a pair of transactions — `Funds Transfer Sent` on the paying
  account, `Funds Transfer Received` on the new one.

The `createAccount` response reports the new account with a balance of
`0`. That is the response's own statement; the row holds `100.00`. Assert
on the row, not on the response.

### A transfer

A transfer writes **two** rows:

| Account | Type | Description |
|---|---|---|
| The source | `DEBIT` | `Funds Transfer Sent` |
| The destination | `CREDIT` | `Funds Transfer Received` |

The balances move by the transferred amount.

### An overdraft is allowed

ParaBank does **not** reject a transfer that exceeds the source account's
balance. The transfer succeeds and the source balance goes negative. This
is ParaBank's behaviour, confirmed by observation — do not write a test
that expects a rejection.

## What is not confirmed

Anything not on this page. If a test needs a fact that is not here, confirm
it against the running database first, and if it cannot be confirmed, mark
it `TODO(confirm):` in the code and report it. Never assert an invented
value.
