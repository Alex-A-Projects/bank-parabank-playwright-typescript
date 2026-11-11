# Documentation

The map of the framework. Start here, then follow the link that matches
what you are doing.

---

## The short version

A Playwright + TypeScript test framework for ParaBank, in three suites that
share one set of rules.

```
src/shared/     the vocabulary every suite speaks
src/ui/         browser tests
src/api/        service tests
src/db/         database tests
tests-ui/  tests-api/  tests-db/     the specs
```

Each suite is layered: **spec → fixtures → layer 3 → the thing itself**.
Assertions live only in the spec. `src/shared/` is the only cross-suite
import path.

---

## The guides

| Guide | Read it when |
|---|---|
| [FEATURE-GATING-GUIDE.md](FEATURE-GATING-GUIDE.md) | You want to know which tests run where, and why one of them was skipped. |
| [DB-TESTING-GUIDE.md](DB-TESTING-GUIDE.md) | You are working on the database suite, or you want to know what the schema actually holds. |

---

## The repository map

### Source

| Path | What lives there |
|---|---|
| `src/shared/env.ts` | The two environment axes, the required-variable reader, the demo credentials. |
| `src/shared/paths.ts` | Every filesystem path, resolved from the repository root. |
| `src/shared/tags.ts` | The selection tags, `featureTag()`, the tag validator. |
| `src/shared/policy.ts` | The feature matrix, the gate, the mutating-test rule. |
| `src/shared/tickets.ts` | The ticket registry — `PB-1xxx` / `PB-2xxx` / `PB-3xxx`. |
| `src/shared/generators.ts` | Random-but-plausible test data. |
| `src/shared/date.ts` | ParaBank's date formats, in one place. |
| `src/shared/assertions.ts` | `collectFailures` / `assertAll` — report every failed check at once. |
| `src/shared/navigation.ts` | Rate-limit aware navigation — retries while the public demo answers with Cloudflare's rate-limit page. |
| `src/shared/account-types.ts` | The account-type codes and names. |
| `src/shared/factories/` | `customerFactory` and `CustomerBuilder`. |
| `src/shared/playwright.shared.ts` | The reporter list, the shared `use` options, the retry policy. |
| `src/ui/pages/` | One class per page. Locators and actions; no assertions. |
| `src/ui/components/` | `LoginPanel` — the reusable piece of the home page. |
| `src/ui/services/` | Multi-step journeys built on the page objects. |
| `src/ui/fixtures/` | The composition root: core → pages → flows. |
| `src/api/clients/` | The HTTP transport, the SOAP client, the REST client, the XML parser. |
| `src/api/strategies/` | The transport Strategy and its factory. |
| `src/api/services/` | One service per functional area, behind the `ParaBankService` facade. |
| `src/api/fixtures/` | The composition root: core → clients → flows. |
| `src/db/client/` | The JDBC bridge and the Java helper — the only place SQL appears. |
| `src/db/repositories/` | Queries, mapped to models. No assertions. |
| `src/db/factories/` | The row factory — turns the helper's output into models. |
| `src/db/drivers/` | The app driver — the suite's only way to write. |
| `src/db/fixtures/` | The composition root: core → client → flows. |
| `src/db/global-setup.ts` | Waits for the lazily-created schema to exist. |

### Configuration

| Path | What it is |
|---|---|
| `config/test-policy.json` | The feature matrix: `env → feature → enabled`. |
| `.env.example` | Every environment variable the suite reads. |
| `playwright.ui.config.ts` | The UI suite's configuration. |
| `playwright.api.config.ts` | The API suite's configuration. |
| `playwright.db.config.ts` | The database suite's configuration. |
| `playwright.config.ts` | The unified root — three projects, for the IDE's test explorer. |
| `docker-compose.yml` | The containerised ParaBank, pinned by OCI digest. |
| `docker-compose.override.yml` | Local-development flavour: loopback ports, capped logs, no auto-restart. |
| `.github/workflows/ci.yml` | Typecheck, UI, API (three transports), DB. |

### Working material

| Path | What it is |
|---|---|
| `.claude/agents/` | Four agents — the orchestrator and the UI / API / database specialists. |
| `.claude/rules/` | Three rules — git flow, plan-before-implementation, headless-first. |
| `.claude/skills/` | Six skills, each a navigation hub with a `references/` folder. |
| `.claude/plans/` | The plan behind the current work. |

---

## The three suites

### UI — `tests-ui/`, 158 tests, 17 files

| File | Ticket | Area |
|---|---|---|
| `home.spec.ts` | PB-1001 | The landing page. |
| `about.spec.ts` | PB-1002 | About ParaBank. |
| `contact.spec.ts` | PB-1003 | The contact form. |
| `login.spec.ts` | PB-1004 | Sign in and sign out. |
| `logout.spec.ts` | PB-1005 | Ending the session. |
| `forgot-login.spec.ts` | PB-1006 | Password recovery. |
| `register.spec.ts` | PB-1007 | Creating a customer. |
| `account-overview.spec.ts` | PB-1008 | The accounts page. |
| `account-details.spec.ts` | PB-1009 | One account's detail. |
| `open-account.spec.ts` | PB-1010 | Opening an account. |
| `transfer-funds.spec.ts` | PB-1011 | Moving money. |
| `bill-pay.spec.ts` | PB-1012 | Paying a bill. |
| `find-transactions.spec.ts` | PB-1013 | Searching transactions. |
| `update-contact-info.spec.ts` | PB-1014 | Changing the profile. |
| `request-loan.spec.ts` | PB-1015 | Applying for a loan. |
| `admin.spec.ts` | PB-1016 | The admin page. |
| `footer-navigation.spec.ts` | PB-1017 | The footer's links. |

### API — `tests-api/`, 35 tests, 7 files

| File | Ticket | Area |
|---|---|---|
| `auth.spec.ts` | PB-2001 | Logging in. |
| `customer.spec.ts` | PB-2002 | Customer records. |
| `account.spec.ts` | PB-2003 | Accounts. |
| `transaction.spec.ts` | PB-2004 | Transactions. |
| `money-movement.spec.ts` | PB-2005 | Deposits, withdrawals, transfers, loans, bills. |
| `stocks.spec.ts` | PB-2006 | Stock positions. |
| `admin.spec.ts` | PB-2008 | The DB-lifecycle endpoints — local only. |

### DB — `tests-db/`, 30 tests, 4 files

| File | Ticket | Area |
|---|---|---|
| `customer.spec.ts` | PB-3001 | The `CUSTOMER` row a registration writes. |
| `account.spec.ts` | PB-3002 | The `ACCOUNT` rows an account opening writes. |
| `transaction.spec.ts` | PB-3003 | The `TRANSACTION` rows a transfer writes. |
| `integration.spec.ts` | PB-3004 | The service's answer and the row's content — the same thing. |

---

## Where to go next

| You want to… | Go to |
|---|---|
| Write a test case | `.claude/skills/skill-write-test-cases/` |
| Write a UI test | `.claude/skills/skill-implement-ui-test-automation/` |
| Write an API test | `.claude/skills/skill-implement-api-test-automation/` |
| Write a database test | `.claude/skills/skill-implement-db-test-automation/` |
| Add Allure metadata | `.claude/skills/skill-allure-playwright/` |
| Review a change | `.claude/skills/skill-code-review/` |
| Know the rules | [CLAUDE.md](../CLAUDE.md) |
