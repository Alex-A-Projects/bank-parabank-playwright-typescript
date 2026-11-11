---
name: skill-implement-api-test-automation
description: >
  Implement Playwright + TypeScript API tests for the ParaBank suite. Use
  when writing or changing anything under tests-api/ or src/api/ — covers
  the SOAP and REST transports, the client and service layers, the
  transport-agnostic test shape and the tagging requirements.
---

# Implementing API tests

Everything the API suite needs to know about how this repository tests a
service contract.

## Start here

| Read | When |
|---|---|
| [`references/layer-rules.md`](references/layer-rules.md) | Before writing anything — the layer contract and the zero-assertion rule. |
| [`references/transports.md`](references/transports.md) | When choosing how to call an operation, or when a transport behaves differently. |
| [`references/client-and-service.md`](references/client-and-service.md) | When writing a client, a service or a strategy. |
| [`references/authoring-checklist.md`](references/authoring-checklist.md) | Before you report a test as done. |

## The rule everything else follows from

**The same test body must pass against SOAP, REST-JSON and REST-XML.**
`API_TRANSPORT` selects the transport for the run; CI executes the suite
three times, once per transport.

Therefore:

- Never branch on the transport inside a test.
- Never assert on a raw envelope or a raw body in a spec — assert on the parsed model a strategy returns.
- A transport-specific quirk belongs in the strategy, not in the spec. If a behaviour is genuinely transport-specific, say so in the report.

## The shape of a test

```ts
import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/api/fixtures';

test(
  ticketTitle(Tickets.apiAccount, 'lists the accounts of the signed-in customer'),
  { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('api-account')] },
  async ({ paraBank, demoSession }) => {
    const result = await paraBank.accounts.list(demoSession.id);

    expect(result.status).toBe(200);
    expect(result.fault).toBeNull();
    expect(result.data?.length).toBeGreaterThan(0);
  },
);
```

- **Title** — `PB-2xxx | what is verified`.
- **Tags** — at least one selection tag, a feature tag for a gated feature, `Tags.MUTATING` when the test changes data.
- **Fixtures** — the `paraBank` facade and the session fixtures come from the barrel.
- **Assertions** — `expect()` in the spec, on the values the service returned.

## Facts about ParaBank that shape the code

- The SOAP endpoint is `/services/ParaBank`; the REST endpoints are under `/services/bank/*`. Both are described by the live WSDL and WADL — read them, never guess a route.
- The account type a caller *gives* the service is a numeric code (`0`, `1`, `2`); the name (`CHECKING`, `SAVINGS`, `LOAN`) is what the service *answers* with.
- The transaction filters expect ParaBank's own `MM-dd-yyyy` date format, not ISO.
- The month filter of `getTransactionsByMonthAndType` is accepted but not applied by the service.
- A money movement answers with a plain sentence ("Successfully transferred $50 from account #13566 to account #13677"). Over SOAP it is parsed out of the envelope; over REST it is served as `application/xml` or `application/json` although it is plain text, so the parsed payload is empty and only the raw body carries the sentence.

## Verify before reporting

```bash
npm run typecheck
API_TRANSPORT=soap npm run test:api
API_TRANSPORT=rest-json npm run test:api
API_TRANSPORT=rest-xml npm run test:api
```

A test is not done because it compiles. Run it against every transport and see it pass.
