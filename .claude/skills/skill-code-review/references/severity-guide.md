# The severity guide

A finding needs a severity, because severity decides what happens to the
pull request. These four levels are enough.

## Blocking

The change breaks a rule of the framework or produces a wrong result.
**It does not merge as it is.**

- An assertion outside the test layer.
- A hard wait.
- A test with no selection tag, or a feature tag that names a feature
  the policy matrix does not know.
- A credential, token or connection string in the source.
- A product fact that was invented rather than confirmed — an endpoint, a
  field name, a schema column, a behaviour.
- A test that is order-dependent or reads another test's data.
- A mutating test that can run against the shared public demo.
- A `test.only` in committed code.
- A typecheck failure.

## Major

The change is structurally sound but carries a real risk. **It should be
fixed before merge**; if the author pushes back with a reason, the
reviewer decides.

- A test that asserts on the implementation instead of on the behaviour.
- A test that would still pass if the product were broken.
- A locator that depends on a brittle attribute, or a CSS selector where
  a role or a label would do.
- A hard-coded wait that hides a race the test will hit on a slower
  machine.
- A page object that mixes navigation, data and assertion logic.
- A new environment variable that is read but not documented in
  `.env.example`.
- A test with a `TODO(confirm):` marker that is *not* reported in the
  pull-request description.

## Minor

Worth fixing, not worth blocking.

- Duplicated setup that should be a fixture.
- A naming that does not match the suite's vocabulary.
- A comment that restates the code instead of explaining it.
- An unnecessary abstraction — a wrapper around a single locator.
- A missing type annotation where the inference is doing the work.

## Suggestion

An opinion. Say it as one, and do not block on it.

- A different way to structure something that would also work.
- An additional case that would be nice to have.
- A wording change in a title or a step name.

## How to write it

```
src/ui/pages/transfer-funds.page.ts:42
The page object asserts on the success banner with expect(...).
This puts an assertion in layer 3 — the spec cannot tell a product
regression from a stale page object, and the check runs even for tests
that never use the banner.
Move the assertion to the spec and leave the page object returning the
locator.
```

The four parts, in order:

1. **where** — `file:line`,
2. **what** — the rule that is broken,
3. **why it matters** — the consequence, not the rule number,
4. **what to do** — the smallest change that fixes it.

## The order of the findings

Blocking first, then major, then minor, then suggestions. A reader
stopping after the first three findings should have found the things
that matter.

If nothing is wrong, say so plainly. Do not invent findings to look
thorough — a review with three real findings is worth more than a review
with twelve, and a reviewer who pads the list trains the team to ignore
the list.
