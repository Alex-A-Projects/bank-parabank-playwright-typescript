# Database authoring checklist

Run this before you report a database test as done.

## The spec

- [ ] The file is in `tests-db/` and ends in `.spec.ts`.
- [ ] It imports `test`, `expect`, `Tags`, `featureTag`, `ticketTitle`, `Tickets` from `../src/db/fixtures`.
- [ ] The title is `ticketTitle(Tickets.db<Feature>, '…')` and starts with `PB-3xxx`.
- [ ] Every test carries at least one selection tag and `featureTag('db-…')`, and that name exists in `config/test-policy.json`.
- [ ] The assertions are in the spec, and only in the spec.
- [ ] The write goes through the application — no `INSERT`, no direct table write.
- [ ] The test asserts only on its own customer's rows.
- [ ] The test passes on its own and in any order.
- [ ] The test does not depend on a global count without taking its own "before" reading.

## The layers

- [ ] No `expect()` in `src/db/`.
- [ ] No SQL outside `src/db/client/jdbc/DbQuery.java`.
- [ ] New query modes use a `PreparedStatement` with `?` placeholders.
- [ ] The connection details come from `process.env` and travel through the child's environment — never as command-line arguments.
- [ ] No literal credential, no literal JDBC URL.
- [ ] Every stored value the test asserts on is on the confirmed-facts list, or is marked `TODO(confirm):`.

## The framework

- [ ] `npm run typecheck` passes.
- [ ] No cross-suite import: a DB file imports from `src/db/` and `src/shared/` only.
- [ ] The test runs with `TEST_ENV=local` — `npm run test:db` sets it.

## Before you report

- [ ] You ran the suite and saw it pass. The report says what you ran and what happened.
- [ ] Every schema fact the test relies on is listed in the report, with how you confirmed it.
- [ ] Every product finding — a behaviour that contradicts the expectation — is reported prominently.
- [ ] You did not claim the whole suite passes because you ran one file.
