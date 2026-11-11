---
name: skill-allure-playwright
description: >
  Add and maintain Allure reporting in the ParaBank suite. Use when a test
  needs steps, labels, severity or an epic/feature/story in its report, or
  when the Allure results and the CI publishing of them need adjusting.
---

# Allure reporting

The suite already reports to Allure — `allure-playwright` is a reporter in
every suite config, and each suite writes into its own results directory
under `allure-results/`. This skill is about adding **meaningful**
metadata, not about decorating every test.

## Start here

| Read | When |
|---|---|
| [`references/steps-and-labels.md`](references/steps-and-labels.md) | When you want a test to show its steps, its severity or its labels in the report. |
| [`references/reporting-layout.md`](references/reporting-layout.md) | When you need to know where the results go, how CI publishes them, or how to read them locally. |

## What is already wired

| Thing | Where |
|---|---|
| The reporter | `reporters(suite)` in `src/shared/playwright.shared.ts` |
| Results directory | `allure-results/ui`, `allure-results/api`, `allure-results/db` |
| HTML report | `playwright-report/ui`, `playwright-report/api`, `playwright-report/db` |
| Local serving | `npm run allure:serve` — reads the whole `allure-results/` tree |
| CI publishing | `.github/workflows/ci.yml` — generates and uploads the report per job |

Every test already reaches the report with its **title** (which starts with
its ticket id) and its **tags**. That is the baseline; the rest is
optional.

## When to add a step

Add an `allure.step` when the test performs **two or three meaningful
phases** that a reader would want to see separated — "sign in", "open the
page", "submit the form". Do not wrap every single action: a report with
forty one-line steps is less readable than one with none.

The step name says what happened, in the product's vocabulary, in the
present tense.

```ts
import { allure } from 'allure-playwright';

test(
  ticketTitle(Tickets.transferFunds, 'confirms a transfer between two of the customer accounts'),
  { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-transfer-funds')] },
  async ({ registeredCustomer, accountOverviewPage, transferFundsPage }) => {
    await allure.step('open the transfer page', async () => {
      await transferFundsPage.open();
      await transferFundsPage.waitForAccountsDropToPopulate();
    });

    await allure.step('move the money', async () => {
      await transferFundsPage.transferFunds({ amount: '10', fromId, toId });
    });

    await expect(transferFundsPage.successHeading).toHaveText(/Transfer Complete!/i);
  },
);
```

## Labels worth setting

| Label | When |
|---|---|
| `severity` | The test is a release gate (`critical`, `blocker`), or it is best-effort (`minor`, `trivial`). |
| `epic` / `feature` / `story` | The report is consumed by more than one team and the suite's folder names are too coarse. |
| `owner` | Somebody owns the area and wants the failures routed to them. |

Use the suite's own vocabulary for the label values: the feature name in
`config/test-policy.json`, the ticket id from `src/shared/tickets.ts`.

**Do not** set a label per test just to fill the report. A label nobody
filters on is noise.

## Where the annotations may live

- **In the spec.** This is the default, and it is where the assertions live.
- **In a service**, when the service is reused and the step describes the service's own work. The service still must not assert — labelling is not asserting.

Never put Allure annotations in a page object to work around a missing step in the spec; that hides the structure of the test.
