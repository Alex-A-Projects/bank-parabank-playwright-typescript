---
name: skill-write-test-cases
description: >
  Write test cases for the ParaBank suite before they are automated. Use
  when asked to design, list, review or prioritise test cases — produces a
  table of cases with an id, a title, the steps, the expected result and
  the tags each case will carry, mapped to the UI, API or database suite.
---

# Writing test cases

Test cases are the contract between what a human wants proved and what the
suite actually runs. This skill produces cases that can be automated
**without further interpretation** — that is the bar.

## Start here

| Read | When |
|---|---|
| [`references/test-case-template.md`](references/test-case-template.md) | You are writing the case table — the column definitions and the field rules. |
| [`references/prioritisation-and-tags.md`](references/prioritisation-and-tags.md) | You are deciding the priority, the selection tag, the feature tag and the ticket id. |
| [`references/example-test-cases.md`](references/example-test-cases.md) | You want a worked example of the format for each of the three suites. |

## The rules that matter

1. **One case proves one behaviour.** If the expected result contains "and", it is probably two cases.
2. **Every case belongs to exactly one suite** — `ui`, `api` or `db`. A case that needs a browser *and* the database is two cases: one that proves the flow, one that proves the write landed.
3. **Every case gets a ticket id** from `src/shared/tickets.ts` — `PB-1xxx` UI, `PB-2xxx` API, `PB-3xxx` DB. The id is the case's title prefix.
4. **Every case gets a selection tag** (`@smoke`, `@sanity`, `@regression`, `@negative`, `@boundary`, `@e2e`, `@security`, `@accessibility`, `@critical`).
5. **A case that changes data gets `@mutating`** and runs against the local container only. See the rule in [`references/prioritisation-and-tags.md`](references/prioritisation-and-tags.md).
6. **A case that touches a gated feature gets a feature tag** (`@feature:<name>`) whose name exists in `config/test-policy.json`. An unknown feature name fails the run loudly — it is not a typo you can afford.
7. **The expected result is observable.** "The balance is correct" is not observable. "The account overview shows a balance of 415.50" is.

## Before you write a case

- Is the behaviour **confirmed**? If the route, the field or the stored value has not been observed, the case cannot state an expected result yet. Either confirm it or mark the case `TODO(confirm)`.
- Does the case need data that does not exist yet? Say how it is set up — every mutating case registers its own customer, it never borrows the seeded demo data.

## Handing cases over

A finished case table goes to the orchestrator agent, which splits it into
ownership areas and routes each chunk to the specialist for its suite
(`agent-ui-test-automation`, `agent-api-test-automation`,
`agent-db-test-automation`).
