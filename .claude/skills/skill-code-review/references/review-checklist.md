# The review checklist

Work through these in order. Each one is a question with a yes/no answer
and a place to look.

## 1. The layering

- [ ] A spec reaches the browser only through the fixture barrel
      (`src/ui/fixtures`, `src/api/fixtures`, `src/db/fixtures`). No
      `import { test } from '@playwright/test'` in a spec.
- [ ] A UI spec imports nothing from `src/api/` or `src/db/`.
- [ ] An API spec imports nothing from `src/ui/` or `src/db/`.
- [ ] A DB spec imports nothing from `src/ui/` or `src/api/`.
- [ ] `src/shared/` is the only cross-suite import path, and it holds no
      suite-specific behaviour.
- [ ] A page object does not import a service, and a service does not
      import a page object.

## 2. The zero-assertion rule

- [ ] No `expect(` in `src/ui/pages`, `src/ui/components`, `src/api/clients`,
      `src/api/services`, `src/db/repositories`, `src/db/factories`,
      `src/db/drivers`, `src/shared/factories`.
- [ ] No `throw new Error('expected ...')` standing in for an assertion in
      those layers either — the same rule, spelled differently.
- [ ] Every assertion in the suite is in a `.spec.ts` file.

## 3. Waits

- [ ] No `waitForTimeout`, no `sleep`, no `setTimeout` in a test path.
- [ ] Waiting is done with `expect(...).toBeVisible()`,
      `waitForResponse`, `waitForURL`, `waitForSelector`, `expect.poll`,
      or an explicit locator state.
- [ ] No `waitForLoadState('networkidle')` used as a substitute for a
      real condition.

## 4. Tagging

- [ ] Every test carries at least one selection tag from `Tags`.
- [ ] Every test carries `featureTag('…')` when it touches a gated
      feature, and the name exists in `config/test-policy.json`.
- [ ] Every test that changes data carries `Tags.MUTATING`.
- [ ] No tag string is written literally in a spec — the constants and
      `featureTag()` are used.

## 5. Titles

- [ ] Every title is built with `ticketTitle(Tickets.x, '…')`.
- [ ] The ticket id is in the right range for the suite: `PB-1xxx` UI,
      `PB-2xxx` API, `PB-3xxx` DB.
- [ ] The title says what the test **proves**, not what it does
      ("…shows the error", not "…checks the error field").

## 6. Isolation and determinism

- [ ] No `test.only`, no `test.skip` with a hard-coded condition that
      hides a real failure, no shared mutable module-level state.
- [ ] The test passes on its own and in any order.
- [ ] A test that reads a global count takes its own "before" reading.
- [ ] A test that mutates data is scoped to its own unique user.

## 7. Secrets and configuration

- [ ] No credential, token, connection string or URL is hard-coded.
- [ ] Every such value comes from `process.env`.
- [ ] `.env.example` documents every key that the code reads.
- [ ] `.env` itself is not committed.

## 8. Invented behaviour

- [ ] Every endpoint, route, field name and schema column the test relies
      on is traceable to the live WSDL, the live WADL, the running
      application or the database.
- [ ] Unknown facts are marked `TODO(confirm):` and reported.
- [ ] A test asserts a value that was measured, not one that was assumed.

## 9. The change itself

- [ ] The diff does what the change says, and nothing else.
- [ ] A new abstraction is used by more than one place, or is thin enough
      not to be a wrapper.
- [ ] The failure mode of a new helper is clear — what it returns when the
      thing it looks for is absent.

## 10. Verification

- [ ] `npm run typecheck` passes.
- [ ] The affected suite was run, and the **actual output** is in the
      description.
- [ ] "The suite passes" was not claimed from a run of one file.
