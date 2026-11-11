# API authoring checklist

Run this before you report an API test as done.

## The spec

- [ ] The file is in `tests-api/` and ends in `.spec.ts`.
- [ ] It imports `test`, `expect`, `Tags`, `featureTag`, `ticketTitle`, `Tickets` from `../src/api/fixtures`.
- [ ] The title is `ticketTitle(Tickets.api<Feature>, '…')` and starts with `PB-2xxx`.
- [ ] Every test carries at least one selection tag.
- [ ] Every test carries `featureTag('api-…')`, and that name exists in `config/test-policy.json`.
- [ ] Every test that changes data carries `Tags.MUTATING`.
- [ ] The test does **not** branch on the transport and does not assert on a raw envelope or body.
- [ ] The assertions are in the spec, and only in the spec.
- [ ] The test passes against SOAP, REST-JSON and REST-XML.
- [ ] The test passes on its own and in any order.

## The layers

- [ ] No `expect()` in `src/api/`.
- [ ] Every new operation exists on **all** transports.
- [ ] Every route, field and status code is traceable to the live WSDL/WADL.
- [ ] No literal credential, no literal base URL.
- [ ] The account type is passed as a code (`AccountTypeCode`) and asserted as a name (`AccountTypeNames`).
- [ ] A POST that needs a body sends one.

## The framework

- [ ] `npm run typecheck` passes.
- [ ] No cross-suite import: an API file imports from `src/api/` and `src/shared/` only.

## Before you report

- [ ] You ran the suite against every transport and saw it pass. The report says which transport produced which result.
- [ ] Every unconfirmed fact is marked `TODO(confirm):` and listed in the report.
- [ ] You did not claim the whole suite passes because you ran one file.
