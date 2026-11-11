# The test case table

Every case is one row. The columns are fixed.

| Column | Meaning |
|---|---|
| **Id** | `TC-<suite>-<n>`, unique inside the table. The ticket id (`PB-1xxx`) is separate and is what ends up in the title. |
| **Suite** | `ui`, `api` or `db`. Exactly one. |
| **Title** | One sentence, in the product's vocabulary, describing what is proved — not what is clicked. |
| **Preconditions** | The state the case needs. Name the fixture or the flow that sets it up. |
| **Steps** | Numbered actions, in the order they happen. Use the product's own labels ("Transfer Funds", "Open New Account"). |
| **Expected result** | What is observable afterwards, precisely enough to be asserted. |
| **Tags** | The selection tag, the feature tag, and `mutating` when the case changes data. |
| **Ticket** | The `PB-…` id from `src/shared/tickets.ts`. |
| **Notes** | Anything unconfirmed, marked `TODO(confirm)`, and why. |

## Writing the steps

- Steps describe the **user's** actions, not the implementation's. "Chooses SAVINGS from the account type drop-down" — not "calls `selectOption('#fromAccountId', …)`".
- A step that only exists to set up the next one may be folded into the precondition.
- Keep the step count low. A case with twelve steps is usually several cases.

## Writing the expected result

The expected result is what the test will assert. It must be **observable and exact**:

| Too vague | Usable |
|---|---|
| The transfer works | The account overview shows the destination account with a balance of 415.50 |
| The customer is saved | The `CUSTOMER` row holds the submitted username, first name, last name, address, city, state, ZIP code and phone number |
| An error is shown | The page shows the paragraph "The account number and confirmation do not match" |

Numbers are written out with their currency (`100.00`), because ParaBank reports two decimal places.

## Preconditions

Preconditions are setup, not assertions. They may reference:

- a fixture (`registeredCustomer`, `authenticatedPage`, `demoSession`),
- a prior step in the same case,
- the seeded demo customer — but only for read-only cases.

A mutating case never starts from the seeded demo data. It registers its own customer, because the seeded dataset is shared and a mutating case against it would change everybody else's data.

## Unconfirmed facts

When a case depends on a fact nobody has confirmed — an exact message, a stored ordinal, a field the API may or may not return — write it in the **Notes** column as `TODO(confirm): <the fact>`. The case is still worth writing; the implementer will confirm it against the running application before automating it.

Never write a case that asserts an invented fact. A case built on a guess produces a test that proves the guess.
