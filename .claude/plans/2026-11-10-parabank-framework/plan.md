# Plan — Restructure ParaBank suite into a production-grade three-suite framework

**Date:** 2026-11-10
**Prompt:** "Create a Playwright + TypeScript Test Framework with Claude Code" (parameterised template)
**Reference implementation:** `/Users/alex/WWT/wwt-ui-tests` (architecture + authoring conventions only)

---

## 1. Product context (Section 1 — confirmed with the requester)

| Field | Value |
|---|---|
| Product name | ParaBank |
| Description | Demo banking application (registration, accounts, transfers, bill pay, loans, stock positions) served by ParaSoft |
| Core user journeys | Register → login → open account → transfer funds → bill pay → find transactions → update profile → request loan; plus admin DB/JMS control and customer lookup |
| App stack | Java/Tomcat 11 (JDK 25) servlet app; HSQLDB 2.7.4 embedded; SOAP + REST-style `/services/bank/*` API |
| Environments | `cloud` (public demo `parabank.parasoft.com`) and `local` (Docker container) |
| Base URLs | cloud `https://parabank.parasoft.com/parabank`, local `http://localhost:8080/parabank` |
| API base URLs | cloud `https://parabank.parasoft.com/parabank`, local `http://localhost:8080/parabank` (paths `/services/ParaBank`, `/services/bank/*`) |
| Auth scheme | Form login (`username`/`password`) + SOAP/REST credentials in the request body. No tokens, no session cookies of note |
| DB engine + version | HSQLDB 2.7.4, embedded in the app container, reachable over TCP on `localhost:9001` (JDBC) |
| Migrations source | None — ParaBank creates and seeds its schema itself (`INIT` / `initializeDB`). No migration tool exists |
| Ticket system + prefix | No real ticket system. Convention: `PB-<id>` — `PB-1xxx` UI, `PB-2xxx` API, `PB-3xxx` DB |
| Test-id attribute in DOM | **None.** Verified empirically: the DOM exposes zero `data-*` attributes and zero `<label>` elements. Locator priority therefore degrades to `id`/role → text → CSS |
| Feature flags | No product-side flags. Gating is owned by the test harness (`config/test-policy.json`) |
| CI platform | GitHub Actions (confirmed) |
| Allure reporting | Yes |

---

## 2. Current state (verified by inspection)

A working suite exists: **192 tests** (143 UI / 30 API / 19 DB) across 19 spec files, 15 page objects, a JDBC DB client, and a working Allure-free reporter setup. It is **not** the framework the prompt specifies.

**Gaps against the prompt:**

1. Flat layout — no `src/shared|ui|api|db`, no `tests-ui|api|db`, one config instead of three.
2. `.claude/` is gitignored → the agents/rules/skills deliverables could never be committed.
3. Zero of the 13 `.claude/` deliverables exist (4 agents, 3 rules, 6 skills).
4. **87 `expect()` calls inside page objects** — violates the zero-assertion rule (§2.2).
5. No models, services, components, factories, or repositories layer.
6. API client logic (`soapCall`, `restCall`, XML parsing) lives **inside `tests/api.spec.ts`** — business logic in the test layer.
7. Two specs import `@playwright/test` directly instead of the fixture barrel.
8. No tagging at all — 0 of 192 tests carry a tag; no `Tags` module, no `featureTag`, no policy matrix.
9. No env module — base URLs hardcoded in 3 places; no two-axis model.
10. No Allure. No `Paths` module (DB client resolves `utils/db` relative to CWD — breaks off-root).
11. 4 `waitForTimeout` calls + 2 fixed sleeps — banned by §3.
12. No ticket prefix on any of the 192 test titles.
13. No `docker-compose.yml`, no healthcheck, no `db:up|db:down|db:logs` scripts.
14. DB connection string, user and password hardcoded in `DbQuery.java`.
15. No per-test isolation strategy; destructive `cleanDB` is order-dependent.
16. No `CLAUDE.md`, no `docs/`, no CI, no `.env.example`, no `typecheck` script.
17. `package.json` name does not match the directory/GitHub repo name.

---

## 3. Target architecture

```
<repo>/
├── .claude/
│   ├── agents/    4 files   orchestrator, ui, api, db
│   ├── rules/     3 files   git-flow, plan-before-implementation, headless-mode
│   ├── skills/    6 dirs    write-test-cases, implement-{ui,api,db}-test-automation,
│   │                       allure-playwright, code-review
│   └── plans/     this file
├── config/test-policy.json
├── docker-compose.yml + docker-compose.override.yml
├── playwright.ui.config.ts / .api.config.ts / .db.config.ts
├── playwright.config.ts          # unified root — 3 projects, for VSCode Test Explorer
├── tsconfig.json  package.json  .env.example  .gitignore
├── .github/workflows/ci.yml
├── CLAUDE.md  README.md
├── docs/INDEX.md  FEATURE-GATING-GUIDE.md  DB-TESTING-GUIDE.md
├── src/
│   ├── shared/   env, paths, tags, policy, date, generators, assertions, tickets
│   ├── ui/       pages, components, services, models, fixtures/(index.ts)
│   ├── api/      clients, services, models, fixtures/(index.ts)
│   └── db/       client, repositories, factories, models, fixtures/(index.ts)
├── tests-ui/     17 spec files
├── tests-api/    API spec files
└── tests-db/     DB spec files
```

`src/shared/` is the only cross-suite import path. Each suite's config sets its own `testDir`.

### Layer rules per suite (prompt §2.2)

| Suite | Test | Fixtures | Layer 3 | Layer 4 |
|---|---|---|---|---|
| UI | spec | composition root | Page Objects, Components, Services | Browser |
| API | spec | composition root | Clients, Services | HTTP (`request`) |
| DB | spec | composition root | Repositories, Factories | JDBC → HSQLDB |

**Zero assertions** in pages, components, services, clients, repositories, factories. Assertions live only in the test layer.

---

## 4. Resolved design decisions

### 4.1 Two independent env axes (§2.7)

| Axis | Variable | Values | Drives |
|---|---|---|---|
| Suite env | `TEST_ENV` | `cloud` \| `local` | Browser navigation **and** the DB connection target |
| Server/API env | `API_ENV` | `cloud` \| `local` | API clients and API fixtures **only** |

They may legitimately differ in one run (e.g. `TEST_ENV=local` with `API_ENV=cloud`). This is intentional, not a bug — documented in `CLAUDE.md` and the README.

`API_ENV` defaults to `TEST_ENV` when unset.

### 4.2 Feature gating (§2.7) — `config/test-policy.json`

Matrix of `env → feature → enabled`, read through `TEST_ENV`.

- A test tagged for a **disabled** feature is auto-skipped with a reason.
- A test tagged with an **unknown** feature **fails loudly** (never silently skipped).

Feature set is derived from ParaBank's real surface. The meaningful distinction is that the
cloud demo exposes **no directly reachable database** and its DB-lifecycle endpoints are
shared/destructive, so `db-*` and `api-db-lifecycle` are enabled on `local` only.

### 4.3 Tags (§2.7)

Two composable axes:
- **Selection tags** — `Tags` module in `src/shared/tags.ts`: `@smoke @sanity @regression
  @negative @boundary @e2e @security @accessibility @critical`.
- **Feature tags** — `featureTag('login')` → `@feature:login`.

An auto `tagGate` fixture validates every tag against the known set (Playwright's
`--strict-markers` equivalent) and applies the policy gate.

### 4.4 DB isolation (§2.6)

**Per-test unique-user scoping.** Every DB test creates its own customer and asserts only
on that customer's rows. Transaction-per-test rollback is not available: HSQLDB is embedded
in the app container and the app holds its own connections, so a test cannot hold a
transaction open across an app-side write. Truncate+reseed is rejected — it wipes the
shared demo dataset the UI suite depends on and is slow.

Destructive DB-lifecycle API tests are gated to `local` only.

### 4.5 Database in Docker (§2.6)

`docker-compose.yml` pins `parasoft/parabank` by **content digest**
(`sha256:8fa644bb…`), not a floating tag — the registry exposes only `latest`,
`baseline` and `feature`, all republished in Nov 2026, so a tag pin would still drift.
Healthcheck polls the HSQLDB port over bash `/dev/tcp`. The app image self-seeds its
schema, so there is no migration step to run; this is documented rather than faked.

### 4.6 Locator strategy (§2.2)

ParaBank exposes no `data-*` attributes and no `<label>` elements (verified against the
live DOM). The documented priority order therefore degrades to:

`id / role` → `text` → `CSS`

…which is what the existing page objects already do. The strategy is written down
explicitly so the constraint is visible rather than accidental.

### 4.7 Ticket IDs

`PB-1xxx` (UI) / `PB-2xxx` (API) / `PB-3xxx` (DB), allocated per feature in
`src/shared/tickets.ts`. Test titles: `PB-1001 | what is verified`.

### 4.8 CI

GitHub Actions (`.github/workflows/ci.yml`) — the remote is `github.com`, so the
prompt's literal `.gitlab-ci.yml` template would target a platform this repo is not on.

---

## 5. Execution order

| # | Step | Notes |
|---|---|---|
| 1 | Foundation | `src/shared/*`, `.env.example`, `package.json`, `tsconfig.json`, three suite configs + unified root config, `config/test-policy.json` |
| 2 | UI layer | Move `pages/` → `src/ui/pages/`, strip all 87 assertions, add components/services/models, build the fixture composition root |
| 3 | API layer | Extract `soapCall`/`restCall`/XML parsing out of the spec into `src/api/clients/`, add services/models/fixtures |
| 4 | DB layer | `src/db/client` (env-driven JDBC), repositories, factories, models, fixtures |
| 5 | Specs | Re-home 19 spec files into `tests-ui/` `tests-api/` `tests-db/`; add tags, ticket-prefixed titles, inline assertions |
| 6 | Infra | `docker-compose.yml` + override, `.github/workflows/ci.yml`, `.gitignore`, `package.json` scripts |
| 7 | `.claude/` | 4 agents, 3 rules, 6 skills (each with a `references/` folder and a navigation-hub `SKILL.md`) |
| 8 | Docs | `CLAUDE.md`, `README.md`, `docs/INDEX.md` + 2 guides |
| 9 | Verify | `npm run typecheck` must pass with zero errors; run each suite; report actual results |

---

## 6. Verification plan

- `npm run typecheck` → zero errors (hard gate).
- `npm run test:ui` → cloud target; report real pass/fail.
- `npm run test:api` → local container; report real pass/fail.
- `npm run test:db` → local container; report real pass/fail.
- Assert: no `waitForTimeout`/`sleep`; no `expect(` in any layer-3 module; every test
  tagged; every title ticket-prefixed; no secrets outside `process.env`.

**No suite is claimed as passing unless it was actually run and observed to pass.**

---

## 7. Known constraints to report at the end

1. The prompt's reference points at `config/test-policy.json` and a "Step 0 — Feature Flag
   Gate" in the reference repo. The reference **deleted** that file in commit `fec5e23`
   ("replace feature-policy matrix with environment tags"). This build keeps the matrix
   because the prompt requires it, and layers the env-tag model on top.
2. The prompt lists `skill-code-review` as adapted from the reference; the reference has
   only 3 skills and no code-review skill. That skill is authored from scratch.
3. Docker's daemon is not always running in this environment; container-backed suites need
   it up.
4. The cloud demo sits behind Cloudflare rate limiting (error 1015). Retries/backoff are
   retained, but a heavily loaded IP can still see failures that are infrastructure, not
   product defects. These must be reported as such, not silently skipped.
