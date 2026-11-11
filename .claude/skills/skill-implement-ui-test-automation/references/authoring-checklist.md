# UI authoring checklist

Run this before you report a UI test as done.

## The spec

- [ ] The file is in `tests-ui/` and ends in `.spec.ts`.
- [ ] It imports `test`, `expect`, `Tags`, `featureTag`, `ticketTitle`, `Tickets` from `../src/ui/fixtures` — and nothing else from Playwright.
- [ ] The title is `ticketTitle(Tickets.<feature>, '…')` and starts with `PB-1xxx`.
- [ ] Every test carries at least one selection tag.
- [ ] Every test carries `featureTag('<name>')`, and that name exists in `config/test-policy.json`.
- [ ] Every test that changes data carries `Tags.MUTATING`.
- [ ] The assertions are in the spec, and only in the spec.
- [ ] One behaviour per test.
- [ ] The test passes on its own: `npx playwright test --config=playwright.ui.config.ts tests-ui/<file>.spec.ts -g "<title>"`.
- [ ] The test passes when the file is run in any order — it does not depend on a previous test.
- [ ] The test does not touch the seeded demo customer's data. It registers its own customer.

## The page object

- [ ] No `expect()` anywhere in `src/ui/`.
- [ ] No `waitForTimeout`, `sleep` or `setTimeout`.
- [ ] Locators are `readonly` fields, named after what the user sees.
- [ ] The methods are named after the user's intent and each does one thing.
- [ ] No literal base URL, no literal credential.
- [ ] The page object was added to the fixture barrel if the spec uses it.

## The framework

- [ ] `npm run typecheck` passes.
- [ ] No new `data-*` attribute, no new test-id convention.
- [ ] No cross-suite import: a UI file imports from `src/ui/` and `src/shared/` only.

## Before you report

- [ ] You ran the test and saw it pass. The report says what you ran and what happened.
- [ ] Every unconfirmed fact is marked `TODO(confirm):` and listed in the report.
- [ ] You did not claim the whole suite passes because you ran one file.
