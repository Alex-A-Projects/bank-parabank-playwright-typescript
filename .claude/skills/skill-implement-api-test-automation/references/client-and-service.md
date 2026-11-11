# Clients, strategies and services

## The three layers

```
service   (src/api/services/)     one product capability: accounts, money, transactions
strategy  (src/api/strategies/)    one transport: SOAP or REST
client    (src/api/clients/)       one HTTP request
```

Each layer knows only the one below it.

## The client

A client sends one request and returns what came back. It knows about HTTP and about the URL. It knows nothing about XML, about the product's operations, or about what a good answer looks like.

```ts
export class RestClient {
  constructor(private readonly request: APIRequestContext, private readonly baseUrl: string) {}

  async get(path: string, headers?: Record<string, string>): Promise<HttpResponse> {
    const response = await this.request.get(`${this.baseUrl}${path}`, { headers });
    return { status: response.status(), body: await response.text() };
  }

  async post(path: string, query?: Record<string, string>, body?: RestBody): Promise<HttpResponse> {
    const response = await this.request.post(`${this.baseUrl}${path}`, {
      params: query,
      data: body ? toForm(body) : undefined,
      headers: body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    });
    return { status: response.status(), body: await response.text() };
  }
}
```

A client never asserts and never parses a payload into a model — that is the strategy's job.

**Watch the body.** A `post` without a body is not the same request as a `post` with one. ParaBank answers `HTTP 415` for a bill payment that arrives without its payee. When a POST needs a body, send it.

## The strategy

A strategy speaks one transport and returns the shared model. It is where the parsing lives.

```ts
export class SoapStrategy implements ParaBankStrategy {
  async getAccounts(customerId: number): Promise<ApiResult<Account[]>> {
    const envelope = buildEnvelope('getAccounts', { customerId });
    const response = await this.soapClient.call(envelope);
    return { status: response.status, fault: parseFault(response.body), data: parseAccounts(response.body), raw: response };
  }
}
```

The SOAP strategy builds the envelope, the REST strategy builds the query or the body, and both return the same `ApiResult`. That is the **Strategy pattern**: the calling code does not know which one it has.

`fast-xml-parser` is configured with `ignoreDeclaration: true, ignorePiTags: true` — the envelopes carry a declaration and processing instructions that the parser would otherwise choke on.

## The service

A service exposes one product capability and delegates to the strategy.

```ts
export class AccountService {
  constructor(private readonly strategy: ParaBankStrategy) {}

  list(customerId: number): Promise<ApiResult<Account[]>> {
    return this.strategy.getAccounts(customerId);
  }
}
```

A service may normalise — for example, turning the plain-text money message into a data value — but it must not assert.

## The facade

`ParaBankService` is the facade a spec uses:

```ts
const paraBank = useParaBank;    // the fixture
await paraBank.accounts.list(id);
await paraBank.money.transfer(from, to, '50');
await paraBank.transactions.list(accountId);
```

The facade groups the services so a spec never assembles them by hand, and so the transport is chosen once, in the factory, rather than in every call.

## Adding an operation

1. **Confirm it exists** in the live WSDL or WADL.
2. Add the method to the strategy interface — one method per transport, same signature.
3. Implement it in the SOAP strategy and in the REST strategy.
4. Expose it through the service, and through the facade if the spec needs it.
5. Add the model, if it is a new shape.
6. Write the test — once, transport-agnostically.

Steps 2 and 3 always happen together. A method that exists on only one transport is a bug: the suite runs all three.
