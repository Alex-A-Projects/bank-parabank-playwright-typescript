# The locator strategy

## What ParaBank gives you

The DOM was inspected: ParaBank exposes **no `data-*` attributes** and **no `<label>` elements**. `getByTestId()` and label-based locators are not available, so the usual priority order degrades.

Use this order:

1. **`id` / `role`** — `page.locator('#amount')`, `page.getByRole('button', { name: 'Transfer' })`.
2. **Text** — `page.getByText('Transfer Complete!')`, `page.locator('h1:has-text("Bill Payment Service")')`.
3. **CSS** — `page.locator('input[name="amount"]')`, `page.locator('table#AccountsTable tbody tr')`.

## What not to do

- **Do not invent a test id.** `data-testid` does not exist in this application. A locator that only works because the test added the attribute proves nothing.
- **Do not use a positional selector** as a first choice — `nth-child(3)` breaks the moment a row is added. Use it only when the row is genuinely identified by its position in a table the test itself controls.
- **Do not reach into the application's JavaScript.** No `page.evaluate` to pull a value out of a global. Read the DOM the user sees.

## Choosing between several matches

`expect(locator).toBeVisible()` fails when the locator resolves to more than one element. Narrow it:

```ts
// The error panel exists on every page; the visible one is the one that matters.
await expect(homePage.errorPanel.first()).toBeVisible();
```

## Waiting for a drop-down to fill

ParaBank fills its account drop-downs asynchronously after the page loads. A fixed delay is banned, so wait for the condition:

```ts
await expect(dropdown.locator('option')).not.toHaveCount(1);   // the placeholder is gone
```

or, more robustly, for a real option:

```ts
await expect(dropdown.locator('option').first()).not.toHaveAttribute('value', '');
```

A page object may wrap this in a named method — `waitForAccountsDropToPopulate()` — so the spec stays readable. The method still waits on a condition; it never sleeps.

## Reading values

Prefer Playwright's assertions over manual parsing:

```ts
await expect(pageObject.balanceCell).toHaveText('$415.50');
```

When the spec needs the number rather than the text, the page object extracts it:

```ts
async getBalance(): Promise<number> {
  const text = await this.balanceCell.textContent();
  return Number((text ?? '').replace(/[$,]/g, ''));
}
```

## Finding a locator in the first place

```bash
npm run db:up
npx playwright codegen http://localhost:8090/parabank
```

Codegen opens a visible browser — that is the one accepted use of a headed browser, because it is a recording tool rather than a test run. Close it when you are done.

Under Playwright MCP, use the headless inspection tools: a snapshot for the DOM and the accessibility tree, a screenshot for the visual state, the console and network tools for what the page did.

Never explore with a mutating action against the shared public demo. Registration, transfers, bill pay, loans and the admin INIT/CLEAN controls are local-only.

## Naming the locator

Name it after what the user sees, not after the element type:

```ts
readonly submitButton: Locator;      // not input2
readonly errorPanel: Locator;        // not div
readonly amountInput: Locator;       // not textbox
```
