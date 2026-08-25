---
title: "port-request-get-post-param-builder"
status: closed
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: targets actionpack; project focus is activerecord and its dependencies (activemodel, activesupport, arel, adapters)"
---

## Context

`ActionDispatch::Request#GET` / `#POST`
(vendor/rails/actionpack/lib/action_dispatch/http/request.rb:395-407 and
:408-440) run the query/form string through
`fetch_header` + `Request::Utils::CustomParamEncoder.action_encoding_template` +
`ActionDispatch::ParamBuilder.from_query_string` / `.from_pairs` /
`.from_hash`, memoize via `set_header`, and re-raise
`ActionController::BadRequest.new("Invalid query parameters: ...")`.

trails' port (`packages/actionpack/src/action-dispatch/http/request.ts:896-903`)
is two one-line delegations:

```ts
GET(): Record<string, unknown> { return this.queryParameters; }
POST(): Record<string, unknown> { return this.requestParameters; }
```

None of the Rails body is present — no header memoization, no encoding
template, no `ParamBuilder`, no `BadRequest` re-raise.

Surfaced by `audit-constructor-idiom-cluster-reasons` (RFC 0084): both rows
were carrying a "constructor idiom — the construction is present in the port"
reason that is false. The corrected baseline reason now cites this story.

## Acceptance criteria

- `GET` and `POST` carry the Rails bodies, with the Rails locals
  (`encodingTemplate`, `rackQueryParams`, `paramList`, `pr`) and the
  `fetchHeader`/`setHeader` memoization.
- `ActionDispatch::ParamBuilder` (`from_query_string`, `from_pairs`,
  `from_hash`) and `Request::Utils::CustomParamEncoder.action_encoding_template`
  are ported or already exist; if not, port them first or split that out.
- The `ParamError` → `ActionController::BadRequest` re-raise is ported with
  Rails' message string.
- The `GET` and `POST` rows are DELETED from
  `scripts/api-compare/call-mismatches-exclude/actiondispatch/http/request.json`
  by hand (only-shrink, `serializeBaseline`).
