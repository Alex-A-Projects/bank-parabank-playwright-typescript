---
name: skill-implement-ui-test-automation
description: >
  Implement Playwright + TypeScript UI tests for the ParaBank suite in the
  Page Object Model style this repository uses. Use when writing or
  changing anything under tests-ui/ or src/ui/ — covers the layer rules,
  the page object and component conventions, the fixture composition
  root, the locator strategy and the tagging requirements.
---

# Implementing UI tests

Everything the UI suite needs to know about how this repository writes
browser tests.

## Start here

| Read | When |
|---|---|
| [`references/layer-rules.md`](references/layer-rules.md) | Before writing anything — the layer contract and the zero-assertion rule. |
| [`references/page-object-conventions.md`](references/page-object-conventions.md) | When writing or changing a page object or a component. |
| [`references/fixture-composition.md`](references/fixture-composition.md) | When adding a fixture, a service or a new page object to the barrel. |
| [`references/locator-strategy.md`](references/locator-strategy.md) | When you need a locator and are about to write one. |
| [`references/authoring-checklist.md`](references/authoring-checklist.md) | Before you report a test as done. |

## The five things that get tests rejected

1. **An `expect()` inside a page object.** Layer 3 reports; the spec judges.
2. **`waitForTimeout(...)` or `sleep(...)`.** Wait for a state, a URL, a response or a value.
3. **A test with no tag, or a title without a ticket id.**
4. **A spec that imports `@playwright/test` directly** instead of `../src/ui/fixtures`.
5. **A mutating test that is not tagged `@mutating`** — or that runs against the shared public demo.

## The shape of a test

```ts
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

test(
  ticketTitle(Tickets.login, 'rejects an empty submission and explains what is missing'),
  { tag: [Tags.NEGATIVE, Tags.REGRESSION, featureTag('ui-login')] },
  async ({ homePage, page }) => {
    await homePage.open();
    await homePage.loginButton.click();

    await expect(page).toHaveURL(/login\.htm/);
    await expect(homePage.errorPanel.first()).toBeVisible();
    expect(await homePage.getErrorMessage()).toMatch(/username and password/i);
  },
);
```

- **Title** — `PB-1xxx | what is verified`.
- **Tags** — at least one selection tag, a feature tag for a gated feature, `Tags.MUTATING` when the test changes data.
- **Fixtures** — page objects and services come from the fixture barrel; a spec never instantiates a page object itself.
- **Assertions** — `expect()` in the spec, web-first.

## Facts about ParaBank that shape the code

- The DOM exposes **no `data-*` attributes and no `<label>` elements** (verified). The locator priority degrades to `id / role` → `text` → `CSS`.
- Registration is the **only** way to create a customer; the service API has no registration operation.
- The account type a caller *gives* the service is a numeric code (`0`, `1`, `2`); the name (`CHECKING`, `SAVINGS`, `LOAN`) is what the service *answers* with.
- Opening an account moves a minimum deposit of **100.00** out of the paying account.
- A newly registered customer is funded with an opening deposit of **515.50** and has **no** transactions yet.

## Verify before reporting

```bash
npm run typecheck
npx playwright test --config=playwright.ui.config.ts tests-ui/<file>.spec.ts
```

A test is not done because it compiles. Run it and see it pass.
