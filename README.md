# ParaBank — Playwright + TypeScript test framework

**A Claude Code framework I built: 4 custom agents, 3 project rules and 6
reusable skills — plus 223 tests in three suites that they drive.**

The test code is only half of this repository. The other half is the
[`.claude/`](.claude/) folder: the agents, the rules and the skills that
write, review and report on that test code — so the next person (or the
next agent) extends the suite by following the same rules instead of
guessing at them.

End-to-end automation for [ParaBank](https://parabank.parasoft.com/parabank/index.htm),
the demo banking application served by ParaSoft.

| Suite | Tests | Files | What it proves |
|---|---:|---:|---|
| **UI** | 158 | 17 | The browser does what the product says it does. |
| **API** | 35 | 7 | The SOAP / REST-JSON / REST-XML services answer correctly — no browser involved. |
| **DB** | 30 | 4 | What the application writes really lands in ParaBank's HSQLDB. |

**223 tests across 28 spec files, in three suites that share one framework.**

---

## The Claude Code framework — what I created

Everything below is hand-authored for this repository and lives in
[`.claude/`](.claude/). It is committed, versioned and reviewed like any
other code.

### 4 custom agents

| Agent | What it does |
|---|---|
| [`agent-test-automation-orchestrator`](.claude/agents/agent-test-automation-orchestrator.md) | Reads a test-case file or a plan, splits the work across the three suites, dispatches each chunk to the right specialist. |
| [`agent-ui-test-automation`](.claude/agents/agent-ui-test-automation.md) | Explores the running application when a locator is unknown, then writes Page Object Model tests into `tests-ui/`. |
| [`agent-api-test-automation`](.claude/agents/agent-api-test-automation.md) | Writes service-level tests that run unchanged against SOAP, REST-JSON and REST-XML. |
| [`agent-db-test-automation`](.claude/agents/agent-db-test-automation.md) | Writes tests that write through the application and read back through JDBC. |

### 3 project rules

| Rule | The rule it enforces |
|---|---|
| [`plan-before-implementation`](.claude/rules/plan-before-implementation.md) | Requirements first, a written plan, approval, then the code. |
| [`git-flow-branching`](.claude/rules/git-flow-branching.md) | GitHub Flow, `<type>/<issue-id>-<description>` branch names, protected `main`. |
| [`playwright-headless-mode`](.claude/rules/playwright-headless-mode.md) | Headless first; a headed browser is a local debugging session, never CI. |

### 6 skills

Each skill is a navigation hub (`SKILL.md`) with a `references/` folder
behind it — 21 reference files in total.

| Skill | What it teaches |
|---|---|
| [`skill-write-test-cases`](.claude/skills/skill-write-test-cases/) | Designing test cases before they are automated: one behaviour per case, the priority, the tags, the ticket id. |
| [`skill-implement-ui-test-automation`](.claude/skills/skill-implement-ui-test-automation/) | The UI layer rules, page-object conventions, fixture composition, locator strategy. |
| [`skill-implement-api-test-automation`](.claude/skills/skill-implement-api-test-automation/) | The API layer rules, the three transports, the client and service design. |
| [`skill-implement-db-test-automation`](.claude/skills/skill-implement-db-test-automation/) | The JDBC bridge, the write path, the isolation strategy, the confirmed schema facts. |
| [`skill-allure-playwright`](.claude/skills/skill-allure-playwright/) | Steps, labels and severity — and where the results go. |
| [`skill-code-review`](.claude/skills/skill-code-review/) | The ordered review checklist and the severity guide. |

### The plan behind it

[`.claude/plans/2026-11-10-parabank-framework/`](.claude/plans/2026-11-10-parabank-framework/)
holds the plan the build followed and the spec-authoring conventions it
produced — the binding rules every `.spec.ts` in this repository obeys.

---

## Quick start

```bash
# 1. Install
npm install
npx playwright install chromium

# 2. Configure
cp .env.example .env        # the defaults are already correct

# 3. Bring up the local ParaBank container
npm run db:up               # http://localhost:8080/parabank

# 4. Verify
npm run typecheck
npm run test:db             # 30 passed
```

A JDK (17 or newer) must be on the `PATH` — the database suite compiles a
small Java helper on demand.

The UI and API suites default to the **cloud** environment (the public
demo). Point them at the container instead:

```bash
TEST_ENV=local API_ENV=local npm run test:ui
TEST_ENV=local API_ENV=local npm run test:api
```

---

## The layout

```
.
├── .claude/                    4 agents, 3 rules, 6 skills + the plan
├── config/test-policy.json     env → feature → enabled
├── docs/                       the guides
├── src/
│   ├── shared/                 env, paths, tags, policy, tickets, date,
│   │                           generators, assertions, navigation, factories
│   ├── ui/                     pages, components, services, models, fixtures
│   ├── api/                    clients, services, strategies, models, fixtures
│   └── db/                     client (JDBC), repositories, factories,
│                               models, drivers, fixtures
├── tests-ui/  tests-api/  tests-db/
├── playwright.ui.config.ts
├── playwright.api.config.ts
├── playwright.db.config.ts
├── playwright.config.ts        unified root — three projects, for the IDE
└── docker-compose.yml          the containerised ParaBank
```

Each suite is layered the same way:

```
spec  →  fixtures  →  layer 3  →  the thing itself
```

| Suite | Layer 3 | Layer 4 |
|---|---|---|
| UI | page objects, components, services | the browser |
| API | clients, services, strategies | HTTP |
| DB | repositories, factories, drivers | JDBC → HSQLDB |

**Assertions live only in the spec.** A page object returns locators; a
service returns data; a repository returns rows. They never call `expect()`.

`src/shared/` is the only cross-suite import path.

---

## The rules the framework enforces

| Rule | How it is enforced |
|---|---|
| No secrets in code | Every credential, URL and connection string comes from `process.env`; `.env.example` documents every key. |
| No hard waits | `waitForTimeout` / `sleep` are banned. Waits are web-first assertions, `waitForResponse`, explicit locator states, or `expect.poll`. |
| Every test is tagged | An automatic tag gate validates the tags before the test body runs. |
| Every title carries a ticket | `ticketTitle(Tickets.x, '…')` → `PB-1011 | …`. |
| Tests are independent | Per-test unique-user scoping; no shared mutable state; no ordering dependency. |
| No `test.only` | `forbidOnly` is on in CI. |
| No invented behaviour | Every route, field and column is confirmed against the live WSDL/WADL, the running application, or the database. |
| Mutating tests stay local | The `@mutating` marker tag plus the automatic tag gate — a shared instance is never written to. |

---

## The two environment axes

| Variable | Drives | Values |
|---|---|---|
| `TEST_ENV` | Browser navigation **and** the database target | `cloud` \| `local` |
| `API_ENV` | The API clients and API fixtures only | `cloud` \| `local` |

They are independent on purpose: `TEST_ENV=local API_ENV=cloud` is a valid
run — a browser against the container while the API suite talks to the demo.

`API_ENV` falls back to `TEST_ENV` when unset.

### Feature gating

`config/test-policy.json` is a matrix of `env → feature → enabled`.

- A test tagged for a **disabled** feature is **skipped**, with the reason
  recorded.
- A test tagged with an **unknown** feature **fails loudly** — a typo must
  never become a test that silently never runs.

`db-*` and `api-db-lifecycle` are disabled for `cloud`: the public demo does
not expose its HSQLDB port, and the lifecycle endpoints wipe shared data.

See [docs/FEATURE-GATING-GUIDE.md](docs/FEATURE-GATING-GUIDE.md).

---

## The tag vocabulary

Two composable axes.

**Selection tags** — for choosing what to run. They never gate execution.

```ts
Tags.SMOKE      // @smoke
Tags.SANITY     // @sanity
Tags.REGRESSION // @regression
Tags.NEGATIVE   // @negative
Tags.BOUNDARY   // @boundary
Tags.E2E        // @e2e
Tags.SECURITY   // @security
Tags.ACCESSIBILITY // @accessibility
Tags.CRITICAL   // @critical
Tags.MUTATING   // @mutating — a marker, not a selection
```

**Feature tags** — matched against the policy matrix.

```ts
featureTag('ui-transfer-funds') // '@feature:ui-transfer-funds'
```

```bash
npx playwright test --config=playwright.ui.config.ts --grep @smoke
npx playwright test --config=playwright.api.config.ts --grep @feature:api-account
```

---

## The database suite

It writes **through the running application** and reads back **through
JDBC** — an `INSERT` would prove the SQL works, not that the application
stores what it claims to.

Node has no JDBC driver, so the suite compiles a small Java helper
(`src/db/client/jdbc/DbQuery.java`) on demand and runs it as a child
process. The connection details travel through the child's environment,
never as command-line arguments.

Isolation is **per-test unique-user scoping**: every test registers its own
customer and asserts only on that customer's rows. See
[docs/DB-TESTING-GUIDE.md](docs/DB-TESTING-GUIDE.md).

---

## The API suite

The same test bodies run against three transports:

```bash
API_TRANSPORT=soap      npm run test:api
API_TRANSPORT=rest-json npm run test:api
API_TRANSPORT=rest-xml  npm run test:api
```

The transport is a **Strategy** behind a **Facade** — a test asks the
facade for an area (`paraBank.accounts.list(...)`) and never knows which
transport answered.

---

## Design patterns

| Pattern | Where |
|---|---|
| **Factory** | `customerFactory` (shared), `dbRowFactory` (database) |
| **Builder** | `CustomerBuilder` — one field at a time |
| **Strategy** | `SoapStrategy` / `RestStrategy` behind `ParaBankStrategy` |
| **Facade** | `ParaBankService` — one entry point per functional area |

---

## Reporting

Every suite writes three kinds of report:

| Artefact | Where |
|---|---|
| Allure results | `allure-results/ui`, `allure-results/api`, `allure-results/db` |
| Playwright HTML report | `playwright-report/ui`, `playwright-report/api`, `playwright-report/db` |
| Traces, video, screenshots | `test-results/` — on failure, or on the first retry |

```bash
npm run allure:serve     # serve the whole results tree
npm run test:report      # open the Playwright HTML report
```

`allure:serve` needs the Allure **command line tool**; the npm package
writes the results, the CLI reads them.

---

## Continuous integration

`.github/workflows/ci.yml` runs four jobs: `typecheck`, `ui`, `api` (a
matrix over the three transports) and `db`. Each job starts the container,
waits for it to become healthy, runs the suite, generates the Allure report
and uploads the artefacts.

CI runs entirely against the **local container**. The public demo is
rate-limited, shared, and must not be written to.

---

## Documentation

| Guide | What is in it |
|---|---|
| [docs/INDEX.md](docs/INDEX.md) | The map of the whole thing. |
| [docs/FEATURE-GATING-GUIDE.md](docs/FEATURE-GATING-GUIDE.md) | The policy matrix, the two axes, how a test is gated. |
| [docs/DB-TESTING-GUIDE.md](docs/DB-TESTING-GUIDE.md) | The JDBC bridge, the isolation strategy, the confirmed schema facts. |
| [CLAUDE.md](CLAUDE.md) | The rules, for both humans and Claude Code. |
| [`.claude/`](.claude/) | The 4 agents, 3 rules and 6 skills described at the top of this file. |

---

## Commands

```bash
npm run typecheck      # the hard gate
npm run test:ui        # the UI suite
npm run test:api       # the API suite
npm run test:db        # the database suite (sets TEST_ENV=local itself)
npm run test:all       # all three, in order

npm run db:up          # start the container
npm run db:down        # stop it
npm run db:logs        # follow its logs
npm run db:restart     # down, then up

npm run allure:serve   # serve the Allure results
npm run test:report    # open the Playwright HTML report
npm run test:headed    # local debugging only — never in CI
```

---

## Branching

GitHub Flow: short-lived branches off `main`, pull requests back to `main`.

```
<type>/<issue-id>-<kebab-case-description>
```

`feat/` `fix/` `refactor/` `chore/` `docs/` `test/` — with `PB-1xxx`
(UI), `PB-2xxx` (API) or `PB-3xxx` (DB) as the issue id, or `pb-0000` when
there is no ticket. `main` is protected; never commit to it directly.
