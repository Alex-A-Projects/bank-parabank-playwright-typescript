# The three transports

## What they are

| Transport | How it is selected | Where it goes |
|---|---|---|
| SOAP | `API_TRANSPORT=soap` | `/services/ParaBank` — a SOAP envelope, WSDL-described |
| REST-JSON | `API_TRANSPORT=rest-json` | `/services/bank/*` — the same operations, JSON |
| REST-XML | `API_TRANSPORT=rest-xml` | `/services/bank/*` — the same operations, XML |

`API_TRANSPORT` is read once, when the module loads. `strategyFactory.resolveId()` reports the transport the run is using, and `appConfig.transport` exposes it to a test.

## The shared model

Whatever the transport, a service returns the same shape:

```ts
interface ApiResult<T> {
  status: number;
  fault: string | null;
  data: T | null;
  raw: { body: string };
}
```

`fault` carries a SOAP fault when the service answered with one; `data` carries the parsed payload; `raw.body` is there for the cases where the product answers with plain text.

## Quirks you must handle in the strategy, not in the spec

### The plain-text money message

A money movement answers with a sentence:

```
Successfully transferred $50 from account #13566 to account #13677
```

Over SOAP the sentence is inside the envelope and the strategy parses it out. Over REST the service serves it as `application/xml` or `application/json` although it is plain text — so the parsed payload is **empty** and only the raw body carries the sentence.

The strategy therefore normalises it: the service returns the sentence as the data, whichever transport produced it. A spec asserts on the sentence, never on `raw.body`.

### The date filters

ParaBank's transaction filters expect its own `MM-dd-yyyy` format, not ISO. A `2025-12-11` filter matches nothing; a `12-11-2025` filter matches the transactions booked that day.

The shared layer has `formatParaBankDate()` for this. Use it rather than formatting by hand.

### The month filter that is ignored

`getTransactionsByMonthAndType` accepts a month and the service **does not apply it** — only the type narrows the result. A test that depends on the month is testing a behaviour that does not exist. Assert on the type, and let the month follow the transaction the test started from.

### The account type code

The account type a caller *gives* the service is a numeric code — `0` checking, `1` savings, `2` loan. It is declared `xs:int` in both the WSDL and the WADL. The name (`CHECKING`, `SAVINGS`, `LOAN`) is what the service *answers* with.

`src/shared/account-types.ts` holds both spellings. Use `AccountTypeCode` on the way in and `AccountTypeNames` on the way out — never a literal `"1"` in a spec.

### The bill payment that needs a body

ParaBank's REST bill-pay route only accepts a request that carries a representation. The REST client sends none, so the service answers **HTTP 415** there — the application log shows `No message body reader has been found for class …Payee, ContentType: application/octet-stream`.

The operation is therefore only exercisable over SOAP until the client sends a body. The bill-payment test skips itself on the two REST transports with that reason recorded, rather than asserting a 415 the product is not asserting.

### The JMS listener

The JMS controls are part of the same service contract. Starting or stopping the listener changes the server's state, so those tests carry `@mutating` and run against the local container only.

A test that stops the listener has to put it back: the listener is **running** on a freshly started instance, and the UI suite's administration test asserts that. Leaving it stopped is an order dependency between two suites.

## Checking the contract yourself

```bash
curl -s http://localhost:8090/parabank/services/ParaBank?wsdl
curl -s http://localhost:8090/parabank/services/bank/application.wadl
```

If an operation is not in the WSDL or the WADL, it does not exist — do not invent it.

## Running against every transport

```bash
API_TRANSPORT=soap     npm run test:api
API_TRANSPORT=rest-json npm run test:api
API_TRANSPORT=rest-xml npm run test:api
```

CI runs all three. A test that passes on one transport only is not finished.
