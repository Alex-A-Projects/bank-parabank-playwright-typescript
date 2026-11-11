# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## What this repository is

A Playwright + TypeScript test framework for **ParaBank**, the demo banking
application served by ParaSoft. Three suites live here, each with its own
Playwright configuration:

| Suite | Directory | Config | What it proves |
|---|---|---|---|
| **UI** | `tests-ui/` | `playwright.ui.config.ts` | The browser does what the product says it does. |
| **API** | `tests-api/` | `playwright.api.config.ts` | The SOAP / REST-JSON / REST-XML services answer correctly, without a browser. |
| **DB** | `tests-db/` | `playwright.db.config.ts` | What the application writes really lands in ParaBank's HSQLDB. |

`playwright.config.ts` is the unified root config — three projects, for the
IDE's test explorer. It is not the canonical way to run a suite.

---

## The rules that are not negotiable

### 1. Plan before implementing

Before any implementation work: gather the requirements, write the plan to
`.claude/plans/<YYYY-MM-DD>-<slug>/plan.md`, present it, and wait for
explicit approval. The rule lives in `.claude/rules/plan-before-implementation.md`.

### 2. Never invent product behaviour

Every endpoint, route, field name, schema column and product behaviour must
be **confirmed**, not assumed:

- routes and field names — the live WSDL (`/services/ParaBank?wsdl`) or the
  live WADL (`/services/bank/application.wadl`),
- behaviour — the running application,
- columns — the database the application creates.

If a fact cannot be confirmed, ask the user, or leave a clearly marked
`TODO(confirm):` in the code **and report it**. Never fabricate one.

### 3. Zero assertions outside the test layer

No `expect()` in a page object, component, service, client, repository,
factory or driver. Those layers report; the spec decides.

### 4. No hard waits

`waitForTimeout`, `sleep` and `setTimeout` in a test path are banned. Wait
for a state: a web-first assertion, `waitForResponse`, `waitForURL`, an
explicit locator state, or `expect.poll` on a condition.

### 5. Credentials only from `process.env`

No secret, token, connection string or URL is written in the source. Every
key the code reads is documented in `.env.example`. The database
credentials travel to the JDBC helper through the child's **environment**,
never as command-line arguments.

### 6. Headless first

Every browser this suite drives runs headless. `--headed` is a local
debugging session only (`npm run test:headed`) and is never used in CI.
See `.claude/rules/playwright-headless-mode.md`.

### 7. `src/shared/` is the only cross-suite import path

A UI spec never imports from `src/api/` or `src/db/`, and vice versa. The
shared layer holds the vocabulary both suites need — tags, tickets, the
environment, the account-type codes, the customer factory — and nothing
suite-specific.

### 8. Every test is tagged and ticket-prefixed

At least one selection tag from `Tags`; a `featureTag('…')` when the test
touches a gated feature; `Tags.MUTATING` when the test changes data. The
title is `ticketTitle(Tickets.x, '…')` — `PB-1xxx` UI, `PB-2xxx` API,
`PB-3xxx` DB.

### 9. Tests are independent and order-agnostic

No shared mutable state, no ordering dependency, no reliance on a previous
test's data. A mutating test creates its own customer and asserts only on
that customer's data.

### 10. `test.only` never reaches a commit

`forbidOnly` is on in CI.

### 11. No suite is claimed as passing unless it was run and seen to pass

Report the **actual** output. If a suite was not run, say so.

---

## The layout

```
.claude/
  agents/    4 - orchestrator, UI, API, database specialists
  rules/     3 - git flow, plan-before-implementation, headless mode
  skills/    6 - each a navigation hub with a references/ folder
  plans/     the plan behind the current work
config/test-policy.json     env -> feature -> enabled
docs/                       the guides
src/
  shared/    env, paths, tags, policy, tickets, date, generators,
             assertions, navigation, account-types, factories
  ui/        pages, components, services, models, fixtures
  api/       clients, services, strategies, models, fixtures
  db/        client (JDBC bridge), repositories, factories, models,
             drivers, fixtures
tests-ui/    tests-api/    tests-db/
```

Each suite is layered `spec → fixtures → layer 3 → the thing itself`:

| Suite | Layer 3 | Layer 4 |
|---|---|---|
| UI | page objects, components, services | the browser |
| API | clients, services, strategies | HTTP |
| DB | repositories, factories, drivers | JDBC → HSQLDB |

---

## The two environment axes

| Variable | Meaning | Values |
|---|---|---|
| `TEST_ENV` | Where the browser navigates **and** which database the DB suite targets. | `cloud` \| `local` |
| `API_ENV` | Which backend the API clients talk to. | `cloud` \| `local` |

They are independent on purpose: `TEST_ENV=local API_ENV=cloud` is a valid
run. `API_ENV` falls back to `TEST_ENV` when it is unset.

- `cloud` — the public demo at `parabank.parasoft.com`. Shared, rate
  limited, and **never written to**.
- `local` — the Dockerised ParaBank container.

**A test that changes data only ever runs against `local`.** The rule is
enforced, not documented: the `@mutating` marker tag plus
`mutatingTestSkipReason()` in the automatic tag gate of every suite. A spec
cannot bypass it by importing `@playwright/test` directly — which is another
reason specs import `test` from their suite's fixture barrel.

---

## Feature gating

`config/test-policy.json` is a matrix of `env → feature → enabled`.

- A test tagged for a **disabled** feature is skipped, with the reason
  recorded.
- A test tagged with an **unknown** feature **fails loudly**. A typo must
  never become a test that silently never runs.

`db-*` and `api-db-lifecycle` are disabled for `cloud`: the public demo does
not expose its HSQLDB port, and the lifecycle endpoints wipe shared data.

---

## Commands

```bash
npm run typecheck      # tsc --noEmit -p tsconfig.json  - the hard gate
npm run test:ui        # the UI suite
npm run test:api       # the API suite
npm run test:db        # the database suite (sets TEST_ENV=local itself)
npm run test:all       # all three, in order

npm run db:up          # start the ParaBank container
npm run db:down        # stop it
npm run db:logs        # follow its logs
npm run db:restart     # down, then up

npm run allure:serve   # serve the Allure results
npm run test:report    # open the Playwright HTML report
```

Useful flags:

```bash
npx playwright test --config=playwright.ui.config.ts --grep @smoke
npx playwright test --config=playwright.api.config.ts --grep @feature:api-account
npm run test:api   # API_TRANSPORT=rest-json npm run test:api
```

---

## Adding a test

1. **Write the case down.** `.claude/skills/skill-write-test-cases/` holds
   the template, the prioritisation rules and the tag vocabulary.
2. **Confirm the facts** the test depends on — route, field name, column,
   behaviour. Anything you could not confirm becomes `TODO(confirm):` and a
   line in your report.
3. **Put it in the right suite.** A browser journey → `tests-ui/`. A service
   contract → `tests-api/`. A question about what was persisted →
   `tests-db/`.
4. **Write it against the rules.** The per-suite skill under
   `.claude/skills/` holds the layer rules, the fixture composition and the
   authoring checklist.
5. **Run it and see it pass.** Paste the actual output.

---

## Reporting

A change report says:

- what changed, and why;
- the **actual** output of the commands that verify it;
- every product fact the change relies on, and how it was confirmed;
- every `TODO(confirm):` left behind;
- every open question.

Do not write "the tests pass" from a run of one file. Do not write it at
all from a run that was never made.

---

## Where to look

| Question | File |
|---|---|
| How do I write a test case? | `.claude/skills/skill-write-test-cases/` |
| How do I write a UI test? | `.claude/skills/skill-implement-ui-test-automation/` |
| How do I write an API test? | `.claude/skills/skill-implement-api-test-automation/` |
| How do I write a database test? | `.claude/skills/skill-implement-db-test-automation/` |
| How do I add Allure metadata? | `.claude/skills/skill-allure-playwright/` |
| How do I review a change? | `.claude/skills/skill-code-review/` |
| What is gated where? | `docs/FEATURE-GATING-GUIDE.md` |
| How does the database suite work? | `docs/DB-TESTING-GUIDE.md` |
| What are the confirmed schema facts? | `.claude/skills/skill-implement-db-test-automation/references/confirmed-schema-facts.md` |
