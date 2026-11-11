# Plan Before Implementation

**Before any implementation work in this repository: gather the requirements, write a plan, get approval, then implement.**

---

## Applies to

- EnterPlanMode tasks.
- Regular implementation requests — a feature, an enhancement, a fix, a refactor.
- Test automation work, new suites, new layers.
- Infrastructure changes — Docker, CI, configuration, environment handling.
- Everything except a clearly trivial change the user explicitly allows skipping the plan for.

---

## Phase 1 — Requirements discovery

Before writing a plan, understand enough to avoid assumptions. Use `AskUserQuestion` until the requirement is clear, or until the user explicitly says to proceed on stated assumptions.

### Product facts

This suite tests ParaBank. Its behaviour must be **confirmed, not assumed**:

- Is the route real? Check the live WSDL (`/services/ParaBank?wsdl`) or the live WADL (`/services/bank/application.wadl`).
- Is the field name real? Check the running application.
- Is the column real? Check the database the application creates.

When a fact cannot be confirmed, three options exist — in this order:

1. **Ask the user.**
2. **Leave a clearly marked `TODO(confirm):` in the code and report it.** The suite's own models carry these markers.
3. Only with the user's explicit approval, assume — and record the assumption in the plan and in the final report.

Never fabricate an endpoint, a field name, a schema column or a product behaviour.

### Functional requirements

What should happen, what should not, the error paths, the boundary values, the negative cases.

### Integration requirements

Which parts of the framework are affected: the three suites, the shared layer, the policy matrix, the environment axes, the Docker stack, CI, the reporting.

### Technical constraints

The layering rules, the tagging rules, the zero-assertion rule, the no-hard-wait rule, the isolation strategy, the TypeScript strictness, and the requirement that credentials come from `process.env` only.

---

## Phase 2 — The plan

Write the plan to:

```
.claude/plans/<YYYY-MM-DD>-<task-slug>/plan.md
```

It contains:

- **Objective** — the problem being solved.
- **Confirmed context** — the facts the work is based on, with how each was confirmed.
- **Requirements** — functional and non-functional.
- **Assumptions** — every assumption that is left, stated plainly.
- **Architecture** — the approach and the decisions behind it.
- **Files to create, modify, remove** — by path.
- **Steps** — an ordered list.
- **Edge cases and failure modes.**
- **Verification** — the exact commands that will prove the work, and what "done" means for each.
- **Risks and alternatives** — what was considered and rejected.

The plan for this framework's own restructuring lives at `.claude/plans/2026-11-10-parabank-framework/plan.md` and the authoring rules it produced live at `.claude/plans/2026-11-10-parabank-framework/spec-conventions.md`.

---

## Phase 3 — Review

1. Open the plan file.
2. Present it to the user.
3. Wait for explicit approval — "approved", "go ahead", "implement", or an equivalent.
4. Do not start implementing before that.

---

## Phase 4 — Implementation

Only after approval:

1. Implement exactly what was approved.
2. If a new requirement turns up: stop, update the plan, and ask again if the scope changed materially.
3. Verify with the commands the plan named, and report the **actual** output.

---

## Core principle

**Think before implementing. Clarify before planning. Plan before implementing.**

And the quality bar that goes with it: **no suite is claimed as passing unless it was run and seen to pass.**
