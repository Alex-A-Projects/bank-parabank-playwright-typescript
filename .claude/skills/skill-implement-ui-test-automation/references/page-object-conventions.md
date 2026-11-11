# Page object and component conventions

## Naming

- One page object per screen: `LoginPage`, `AccountOverviewPage`, `TransferFundsPage`.
- One component per repeated widget: `LoginPanel`, `ErrorPanel`.
- A service per multi-step flow: `AuthService`, `AccountService`, `CustomerService`.
- Page objects live in `src/ui/pages/`, components in `src/ui/components/`, services in `src/ui/services/`.

## Shape

```ts
export class TransferFundsPage {
  readonly heading: Locator;
  readonly amountInput: Locator;
  readonly transferButton: Locator;
  readonly successHeading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.locator('h1');
    this.amountInput = page.locator('#amount');
    this.transferButton = page.locator('input[type="submit"]');
    this.successHeading = page.locator('h1:has-text("Transfer Complete!")');
  }

  /** Open the page. */
  async open(): Promise<void> {
    await this.page.goto('/transfer.htm');
  }

  /** The accounts the customer can pay from. */
  async getFromAccountIds(): Promise<string[]> {
    return this.fromAccountDropdown.locator('option').evaluateAll(...);
  }
}
```

## The rules

1. **Locators are public `readonly` fields.** The spec asserts on them directly: `await expect(pageObject.heading).toBeVisible()`.
2. **A page object never asserts.** It exposes locators and reads state. See the layer rules.
3. **Methods are named after the user's intent** — `open()`, `login()`, `transferFunds()`, `getAvailableTypes()`. Not `click()`, not `doTransfer()`.
4. **A method does one thing.** `open()` opens; `transferFunds()` fills and submits. A method that opens, fills, submits and asserts is a test hiding in a page object.
5. **No fixed waits.** If a method needs to wait, it waits for a condition — a visible element, a filled drop-down, a URL.
6. **Return data, not assertions.** `getBalance(): Promise<number>` — the spec decides what a correct balance is.
7. **No magic strings that belong in the shared layer.** A URL that several pages use, a feature name, a ticket id — those live in `src/shared/`.

## When to add a component

A component is a widget that appears on more than one page with the same behaviour — the login panel is on every unauthenticated page, the error panel appears everywhere. If it appears once, it belongs to the page object.

```ts
export class LoginPanel {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) { /* ... */ }

  /** Fill the panel and submit it. */
  async submit(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

## Services

A service owns a **flow** that spans more than one page, or a piece of business logic that several tests need. It uses page objects and returns data.

```ts
export class AccountService {
  constructor(private readonly page: Page) {}

  /** Open a savings account for the signed-in customer. */
  async openAccount(type: string): Promise<string> {
    const overview = new AccountOverviewPage(this.page);
    const openAccount = new OpenAccountPage(this.page);
    // ...
    return newAccountId;
  }
}
```

A service may use a page object, but a page object never uses a service — that would be a cycle.

## Anti-patterns

| Anti-pattern | Why it hurts |
|---|---|
| `expect()` in a page object | The judgement leaves the spec; the report no longer shows which assertion failed. |
| A page object that takes a `testInfo` | The page object has become a test. |
| One page object for the whole application | Every test depends on every change. |
| A method that returns `void` and the spec re-reads the DOM | The spec now knows the page's internals. |
| A helper that wraps `expect()` to "keep the spec clean" | The same problem, with an extra layer. |
