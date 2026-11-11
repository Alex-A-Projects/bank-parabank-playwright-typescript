# GitHub Flow & Branch Naming — ParaBank test suite

**Applies to:** every branch, commit and pull request in this repository.

---

## 1. The model

This repository follows **GitHub Flow**: one permanent branch, short-lived feature branches, pull requests back to `main`.

| Branch | Purpose | Rule |
|---|---|---|
| `main` | Stable, always usable, always green | Never commit directly to it |

`main` is protected: CI runs on every push and every pull request, and a red pipeline blocks the merge.

---

## 2. Branch types

| Prefix | Use it for |
|---|---|
| `feat/` | New test coverage, a new suite, a new framework capability |
| `fix/` | A failing test, a flaky test, a broken fixture |
| `refactor/` | Restructuring with no change in what is tested |
| `chore/` | Dependencies, configs, tooling, the CI pipeline |
| `docs/` | `README.md`, `CLAUDE.md`, `docs/`, `.claude/` |
| `test/` | Test-only changes: new specs, test fixes, tag changes |

There is no `ci/` prefix — that work belongs to `chore/`.

---

## 3. Naming format

```
<type>/<issue-id>-<kebab-case-description>
```

The issue id is the suite's ticket convention: `pb-3001` for the database suite, `pb-2005` for the API suite, `pb-1010` for the UI suite. A change that spans suites uses the highest-numbered area it touches, or `pb-0000` when there is no ticket.

```
feat/pb-3002-db-account-specs
feat/pb-2005-api-money-movement
fix/pb-1011-transfer-funds-dropdown
chore/pb-0000-github-actions-pipeline
docs/pb-0000-database-testing-guide
```

### Rules

1. Lowercase, kebab-case only.
2. The issue id is mandatory once a ticket exists; `pb-0000` marks work without one.
3. The description is 2–5 words and says what changed.
4. One logical change per branch.
5. No personal names, no `wip`, no `temp`, no `test-stuff`.

---

## 4. Working on a branch

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/pb-3002-db-account-specs
```

Before you push:

```bash
npm run typecheck
npm run test:ui
npm run test:api
npm run test:db
```

`npm run typecheck` is a hard gate — a compile error never reaches a pull request.

---

## 5. Commits

- One logical change per commit; the message says what changed and why.
- Conventional-ish prefixes: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- No "fixup" commits in the history — rebase locally before pushing.

---

## 6. Pull request

1. Push the branch, open a pull request against `main`.
2. The description says what changed, why, and how it was verified — paste the **actual** test output, never a summary of what you expect.
3. CI must be green: typecheck, UI, API (all three transports) and the database suite.
4. Reviewer approval, then squash-merge.
5. Delete the branch.

---

## 7. What never goes into a commit

- `.env` — the real environment file. Only `.env.example` is committed.
- `allure-results/`, `allure-report/`, `playwright-report/`, `test-results/` — build output.
- `src/db/client/jdbc/*.class` — the compiled helper; it is rebuilt on demand.
- `cookies.txt`, `pbcookies.txt` — saved browser sessions.
- The legacy flat tree (`pages/`, `utils/`, `fixtures/`, `tests/` at the repository root) — it was replaced by `src/<suite>/` and `tests-<suite>/`; it must not come back.

---

## 8. Checklist before a pull request

- [ ] Branch name follows `<type>/<issue-id>-<description>`.
- [ ] One logical change.
- [ ] `npm run typecheck` passes.
- [ ] The affected suite was run, and the output is in the description.
- [ ] No secrets, no build output, no `.env`.
- [ ] `main` was not committed to directly.
