# Steps and labels

## When a step is worth adding

A step earns its place when a reader of the report would want to know
**where** the test was when it failed. That means a test with two or three
recognisable phases — "sign in", "open the page", "submit the form".

A step does not earn its place when it wraps a single action that the
report already shows in the attachment, or when it exists only to make
the report look busy.

```ts
// Worth it - three phases a reader recognises.
await allure.step('open the transfer page', async () => { ... });
await allure.step('move the money', async () => { ... });
await allure.step('check the balances', async () => { ... });
```

```ts
// Not worth it - one action, no new information.
await allure.step('click transfer', async () => {
  await transferFundsPage.submit.click();
});
```

## Writing a step name

- Present tense, product vocabulary: "open the account overview", not "navigated".
- Say what the reader learns: "the accounts drop-down populated", not "wait for dropdown".
- No generic names: "step 1", "do the thing", "test data setup".
- Keep it under about eight words.

## Nested steps

Allure renders a tree. A step inside a step is fine when the inner one is
a genuinely separate activity:

```ts
await allure.step('register a customer', async () => {
  await allure.step('fill the registration form', async () => { ... });
  await allure.step('submit and wait for the overview', async () => { ... });
});
```

Three levels is already too deep for a report a human reads.

## Labels

| Label | Value source | When to set it |
|---|---|---|
| `severity` | `critical` / `blocker` / `minor` / `trivial` | The test gates a release, or it is best-effort. |
| `feature` | The feature name from `config/test-policy.json` | The report is read by people who do not know the folder layout. |
| `epic` | The ticket area — `PB-1xxx`, `PB-2xxx`, `PB-3xxx` | The report is shared across teams. |
| `story` | The ticket id, e.g. `PB-1011` | Failures are routed by ticket. |
| `owner` | A team name | Somebody is on the hook for the area. |

The label values must come from the suite's own vocabulary — the ticket
registry in `src/shared/tickets.ts` and the policy matrix in
`config/test-policy.json`. Do not invent an epic name that no other file
knows about.

## Setting a label

```ts
import { allure } from 'allure-playwright';

test.beforeEach(async ({}, testInfo) => {
  await allure.label('severity', 'critical');
  await allure.label('feature', 'ui-transfer-funds');
});
```

A `beforeEach` in the spec's own `describe` block is the right place —
it covers every test in the block without repeating itself.

`allure.label` is metadata, not an assertion. It may live in a service
that is reused across specs, but it must never become a place where a
failure is raised — that is the zero-assertion rule again.

## What not to do

- **Do not** put a label on every test to fill the report. A label nobody
  filters on is noise.
- **Do not** use Allure to smuggle an assertion into a page object.
- **Do not** use a step to hide a slow wait. A step is a narrative
  boundary, not a timing device.
- **Do not** change the test's title from inside a step. The title carries
  the ticket id; it is the contract with the report.
