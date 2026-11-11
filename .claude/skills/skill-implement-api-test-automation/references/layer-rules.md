# The layer rules

## The chain

```
spec (tests-api/*.spec.ts)
  → fixtures (src/api/fixtures/)
    → Services / Strategies / Clients (src/api/services, strategies, clients)
      → HTTP (the `request` fixture)
```

The API suite opens no browser. The built-in `request` fixture is the only transport.

## What each layer may do

| Layer | May | May not |
|---|---|---|
| **Spec** | Assert on the returned status, fault and data | Build a raw request, parse a raw body, branch on the transport |
| **Fixture** | Provide the facade, the session, the transport | Assert, hold mutable state between tests |
| **Service** | Expose one operation per product capability | Assert, know about the wire format |
| **Strategy** | Speak one transport, return the same model for every transport | Assert |
| **Client** | Send one HTTP request, return status and body | Assert, parse XML or JSON into a model |

## The zero-assertion rule

No `expect()` in a client, a strategy or a service. They report what the service answered; the spec judges it.

```ts
// Wrong.
async getAccount(id: number): Promise<Account> {
  const response = await this.client.get(...);
  expect(response.status).toBe(200);
  return parse(response.body);
}

// Right.
async getAccount(id: number): Promise<ApiResult<Account>> {
  const response = await this.client.get(...);
  return { status: response.status, fault: null, data: parse(response.body) };
}
```

## Cross-suite isolation

An API spec imports from `src/api/` and `src/shared/` only. It never reaches into `src/ui/` or `src/db/`.

## The fixture barrel

```ts
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';
```

Never `import { test } from '@playwright/test'` — that bypasses the tag gate, which is what applies the feature matrix and the local-only rule for `@mutating` tests.

## The transport rule

**The same test body must pass against SOAP, REST-JSON and REST-XML.**

That is only possible if the spec never sees the wire format:

- the strategy parses the transport's answer into the shared model,
- the service returns `{ status, fault, data }`,
- the spec asserts on that.

A spec that reaches for `result.raw.body` to find a message is a spec that has leaked the transport. Where the product genuinely answers with plain text, the *strategy* normalises it and the spec asserts on the normalised value.

## What the API suite may never do

- **Assert a message only the cloud demo produces.** The demo and the container are the same application, but a message that differs between builds is a finding, not a test expectation.
- **Wipe the database on the shared instance.** The lifecycle operations are gated to `local` by `config/test-policy.json` and by `@mutating`.
- **Invent an endpoint.** Every route comes from the live WSDL or WADL.
