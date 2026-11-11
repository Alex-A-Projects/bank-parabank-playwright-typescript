# The layer rules

## The chain

```
spec (tests-ui/*.spec.ts)
  → fixtures (src/ui/fixtures/)
    → Page Objects / Components / Services (src/ui/pages, components, services)
      → the browser
```

Each arrow is the only way down. A layer may use the layer below it and nothing else.

## What each layer may do

| Layer | May | May not |
|---|---|---|
| **Spec** | Assert, drive the flow, read values | Contain a locator, talk to the page directly, import `@playwright/test` directly |
| **Fixture** | Build the objects a spec needs, compose other fixtures | Assert, hold mutable state between tests |
| **Page Object / Component / Service** | Expose locators, read state, perform one navigation | Assert, wait for a fixed time, know about other suites |
| **Browser** | — | — |

## The zero-assertion rule

A page object **never** calls `expect()`.

```ts
// Wrong - the page object judges.
async getBalance(): Promise<number> {
  const text = await this.balanceCell.textContent();
  expect(text).toMatch(/\d/);
  return Number(text?.replace(/[$,]/g, ''));
}

// Right - the page object reports, the spec judges.
async getBalance(): Promise<number> {
  const text = await this.balanceCell.textContent();
  return Number((text ?? '').replace(/[$,]/g, ''));
}
```

The same applies to services, components, clients, repositories, factories and drivers. A layer-3 module that throws on invalid input is a borderline case: a `throw` for a precondition the code cannot proceed with is fine; a `throw` that stands in for an assertion is not.

## The no-hard-wait rule

`waitForTimeout()`, `sleep()` and `setTimeout()` are banned in every layer. They make the suite slow when it works and flaky when it does not.

Instead:

| Instead of waiting | Wait for |
|---|---|
| a fixed delay after a click | `await expect(locator).toBeVisible()` |
| a fixed delay after a navigation | `await page.waitForURL(/overview\.htm/)` |
| a fixed delay for a request | `await page.waitForResponse((r) => r.url().includes('/services/bank/'))` |
| a fixed delay for a drop-down to fill | `await expect(dropdown.locator('option')).not.toHaveCount(1)` |
| a fixed delay for a value to settle | `await expect(cell).not.toHaveText('')` |
| a fixed delay between retries | `expect.poll(...)` — poll on the condition |

Two places in the suite poll on a condition rather than sleeping:

- the database suite's global setup, which polls the database until it
  answers;
- `src/shared/navigation.ts`, which retries a navigation while the public
  demo answers with Cloudflare's rate-limit page.

Neither of them is a fixed sleep.

## Cross-suite isolation

`src/shared/` is the **only** path the suites share.

```ts
// Allowed - shared vocabulary.
import { featureTag } from '../src/shared';

// Not allowed - a UI spec never reaches into another suite.
import { ParaBankAppDriver } from '../src/db/drivers/app.driver';
```

A UI spec may not import from `src/api/` or `src/db/`, and an API spec may not import from `src/ui/` or `src/db/`. The three suites are separate systems that happen to share a vocabulary.

## The fixture barrel

A spec imports `test`, `expect` and the vocabulary from **one** place:

```ts
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';
```

Never `import { test, expect } from '@playwright/test'`. The barrel is where the suite's fixtures, its tag gate and its models are wired together; importing Playwright directly bypasses all of it — most importantly the tag gate, which is what enforces the feature policy and the local-only rule.
