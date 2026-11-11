---
name: skill-code-review
description: >
  Review a change in the ParaBank suite against the framework's rules —
  layer separation, zero assertions outside the test layer, no hard
  waits, complete tagging, ticket-prefixed titles, isolation between
  tests, secrets from the environment only, and no invented product
  behaviour. Use when reviewing a diff, a pull request or a single spec.
---

# Code review

A review of this repository is mostly a review against a small number of
rules that are easy to state and easy to break. This skill is that
checklist, plus the judgement calls around it.

## Start here

| Read | When |
|---|---|
| [`references/review-checklist.md`](references/review-checklist.md) | Always — this is the ordered list of checks. |
| [`references/severity-guide.md`](references/severity-guide.md) | When deciding whether a finding blocks the merge or is a suggestion. |

## The blocking rules

These are not style preferences. A change that breaks one of them does not merge.

1. **Zero assertions in layer 3.** No `expect()` in a page object, component, service, client, repository, factory or driver. Assertions belong in the spec.
2. **No hard waits.** `waitForTimeout`, `sleep`, `setTimeout` in a test path — banned. Wait for a state, a URL, a response, a value.
3. **Every test carries a selection tag**, plus a feature tag for a gated feature, plus `Tags.MUTATING` when the test changes data.
4. **Every title starts with a ticket id** — `PB-1xxx` UI, `PB-2xxx` API, `PB-3xxx` DB.
5. **No `test.only`** in committed code. `forbidOnly` is on in CI.
6. **Tests are independent.** No shared mutable state, no ordering dependency, no reliance on a previous test's data.
7. **No secrets in code.** Every credential, token, connection string and URL comes from `process.env`, and `.env.example` documents the key.
8. **No invented product behaviour.** Every endpoint, route, field name and schema column must be traceable to the live WSDL/WADL, the running application or the database. Unknown facts are marked `TODO(confirm):` and reported.
9. **The layering holds.** A spec reaches the browser only through the fixture barrel; a UI spec never imports from `src/api/` or `src/db/`; `src/shared/` is the only cross-suite path.
10. **The suite was actually run.** A claim of "the tests pass" without the output is not a review.

## The judgement calls

- **Is the test proving the right thing?** A test that asserts on the implementation rather than on the behaviour is a finding even when it passes.
- **Does the test fail for the right reason?** A test that passes because the product is broken is worse than a failing test.
- **Is the isolation real?** A test that reads another test's customer is a finding, even if it passes today.
- **Is the abstraction earning its keep?** A new page object that wraps one locator used once is usually a step backwards.
- **Would a new team member understand this?** A comment that explains *why* beats a comment that restates *what*.

## How to report a finding

Each finding says:

- **where** — `file:line`,
- **what** — the rule that is broken,
- **why it matters** — the consequence, not the rule number,
- **what to do** — the smallest change that fixes it.

Rank the findings: the blocking rules first, then the judgement calls, then the suggestions. If nothing is wrong, say so plainly — do not invent findings to look thorough.
