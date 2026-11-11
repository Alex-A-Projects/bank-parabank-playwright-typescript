# Prioritisation and tags

## The three axes

A case carries up to three tags, and each one answers a different question.

| Axis | Tag | Answers |
|---|---|---|
| Selection | `@smoke`, `@sanity`, `@regression`, `@negative`, `@boundary`, `@e2e`, `@security`, `@accessibility`, `@critical` | *Which tests do I want to run?* |
| Feature | `@feature:<name>` | *Is this feature available here?* |
| Policy marker | `@mutating` | *Does this test change data?* |

**Every case carries at least one selection tag.** A case with no tag can never be selected, and it will rot unnoticed.

### The selection tags

| Tag | Use it for |
|---|---|
| `@smoke` | The handful of cases that must pass for the build to be meaningful. Keep it small. |
| `@sanity` | The surface of a feature: the form renders, the fields are named correctly. |
| `@regression` | The default for a case that guards a behaviour. |
| `@negative` | The case proves something is **rejected**. |
| `@boundary` | The case sits on a limit: zero, the maximum, an amount above the balance. |
| `@e2e` | The case crosses several screens or several services. |
| `@security` | The case is about authorisation, credentials or data exposure. |
| `@accessibility` | The case is about the accessibility tree, names or roles. |
| `@critical` | The case guards a business-critical path. A label, not a selection mechanism. |

A case may carry several: `@smoke @regression @critical` is normal.

### The feature tag

`@feature:<name>` is matched against `config/test-policy.json`:

- a feature that is **disabled** for the current environment → the case is skipped, with the reason recorded;
- a feature that is **unknown** → the run **fails loudly**. A typo must never turn into a case that silently never runs.

The names come from the matrix — `ui-login`, `ui-transfer-funds`, `api-money-movement`, `db-account`, and so on. The matrix is the list of truth; the tag is a pointer into it.

### `@mutating`

`@mutating` marks a case that **changes data**: it registers a customer, opens an account, moves money, pays a bill, requests a loan, resets the database, or starts and stops the JMS listener.

A mutating case runs **against the local container only**. The public cloud demo is shared by everybody who points a browser at it, so writing to it would change somebody else's data.

The rule lives in one place — `mutatingTestSkipReason()` in `src/shared/policy.ts` — and every suite's tag gate applies it. A case that changes data and forgets the tag will run against the shared demo, so the tag is part of the case's definition, not an afterthought of the implementation.

The same rule decides the **environment**: a mutating case needs `TEST_ENV=local` (UI and database suites) or `API_ENV=local` (API suite).

## Prioritising

When everything could be a case, order by risk:

1. **The money.** Transfers, deposits, withdrawals, bill pay, loans.
2. **The data.** Registration, profile updates, account opening.
3. **The gate.** Login, logout, session handling.
4. **The destructive.** The admin INIT and CLEAN controls, the database lifecycle operations.
5. **The surface.** Form rendering, field names, navigation.

Then pick the tags from the risk:

- money and data → `@critical` if a failure would cost somebody money, `@regression` always;
- rejections → `@negative`;
- limits → `@boundary`;
- the destructive → `@mutating`, and `@critical` only if the pipeline must not proceed without them.

## Ticket ids

The id is the case's identity in the report. It comes from `src/shared/tickets.ts`:

| Suite | Ids | Feature areas |
|---|---|---|
| UI | `PB-1001` … `PB-1017` | home, about, contact, login, logout, forgot-login, register, account-overview, account-details, open-account, transfer-funds, bill-pay, find-transactions, update-contact-info, request-loan, admin, navigation |
| API | `PB-2001` … `PB-2008` | auth, customer, account, transaction, money-movement, stocks, jms, db-lifecycle |
| DB | `PB-3001` … `PB-3004` | customer, account, transaction, integration |

A new feature area gets the next free id in its range. Never reuse an id, and never invent one that is not in the registry.
