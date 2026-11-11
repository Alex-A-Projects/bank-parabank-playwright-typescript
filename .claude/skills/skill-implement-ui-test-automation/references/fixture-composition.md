# The fixture composition root

`src/ui/fixtures/` is the only place the UI suite's pieces are wired together. A spec imports from `src/ui/fixtures/index.ts` and from nowhere else.

## The layers

| File | Provides |
|---|---|
| `core.fixture.ts` | `appConfig`, the automatic `_tagGate` |
| `pages.fixture.ts` | One fixture per page object and component |
| `flows.fixture.ts` | Services and the multi-step flows |
| `index.ts` | The composition root — the `test` a spec imports |

## The composition root

```ts
type UiFixtures = CoreFixtures & PagesFixtures & FlowFixtures;

export const test = base.extend<UiFixtures>({
  ...coreFixtures,
  ...pagesFixtures,
  ...flowFixtures,
});

export { expect } from '@playwright/test';
export { Tags, featureTag } from '../../shared/tags';
export { ticketTitle, Tickets } from '../../shared/tickets';
```

Each layer's fixtures are typed with `satisfies Parameters<typeof base.extend<...>>[0]`, so a typo in a fixture name or a wrong fixture type fails the typecheck instead of failing at runtime.

## The automatic tag gate

`_tagGate` runs before every test, whether the test asked for it or not:

```ts
_tagGate: [
  async ({}, use, testInfo) => {
    assertKnownTags(testInfo.tags);
    const reason =
      featureGateSkipReason(testInfo.tags, TEST_ENV) ??
      mutatingTestSkipReason(testInfo.tags, TEST_ENV);
    if (reason) {
      testInfo.skip(true, reason);
    }
    await use(undefined);
  },
  { auto: true, title: 'tag-gate' },
],
```

It does three things:

1. **Rejects an unknown tag.** A typo throws instead of producing a tag no `--grep` will ever match.
2. **Applies the feature matrix.** A test for a feature that is disabled in this environment is skipped, with the reason recorded in the report.
3. **Applies the local-only rule.** A test tagged `@mutating` is skipped outside the local container.

This is why a spec never imports `@playwright/test` directly — that import would bypass the gate entirely.

## Adding a page object to the barrel

```ts
// pages.fixture.ts
export const pagesFixtures = {
  transferFundsPage: async ({ page }, use) => {
    await use(new TransferFundsPage(page));
  },
} satisfies Parameters<typeof base.extend<CoreFixtures & PagesFixtures>>[0];
```

One fixture per page object, named after the page object in camelCase. The spec then asks for it by name:

```ts
test('...', async ({ transferFundsPage }) => { ... });
```

## Adding a flow

A flow fixture performs setup and hands the spec the result. It may **throw** when a precondition fails — that is setup failing, not an assertion:

```ts
export const flowFixtures = {
  registeredCustomer: async ({ page, customerService }, use) => {
    const payload = customerFactory.build();
    await customerService.register(payload);
    await use(payload);
  },
};
```

## What a fixture must never do

- **Assert.** A fixture that throws on a failed expectation hides the failure's context. Throw a plain `Error` with the reason instead.
- **Share mutable state between tests.** Every fixture builds fresh data per test. The seeded demo customer is the only shared thing, and it is read-only.
- **Depend on the order the tests run in.**
- **Reach into another suite.** `src/shared/` is the only cross-suite path.

## Worker safety

The UI suite runs single-threaded (`workers: 1`) on purpose: several tests change the demo customer's data — the admin page re-seeds the shared dataset — and parallel workers would interleave those changes.

A new fixture that changes shared data must not assume it is the only thing running. Either give the test its own customer, or keep the suite single-threaded.
