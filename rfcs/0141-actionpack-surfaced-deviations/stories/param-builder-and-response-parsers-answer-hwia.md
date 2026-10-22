---
title: "ParamBuilder#make_params answers a null-prototype object, not a HashWithIndifferentAccess"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::ParamBuilder#make_params` is
`ActiveSupport::HashWithIndifferentAccess.new`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/param_builder.rb:162-164`),
so `from_query_string` / `from_pairs` answer an HWIA at every level. trails'
`makeParams` (`packages/actionpack/src/action-dispatch/http/param-builder.ts:249-251`)
answers `Object.create(null)`, so `param_builder_test.rb:15,21`'s
`assert_instance_of ActiveSupport::HashWithIndifferentAccess` fails against the port.

The `RequestEncoder` response-parser half of this story landed in trails#9076
(`testing/request-encoder.ts:99-104` parse JSON into HWIA and HTML through
`Testing.htmlDocument()`).

## Acceptance criteria

- `makeParams` answers a `HashWithIndifferentAccess`, and every caller of
  `fromQueryString` / `fromPairs` / `fromHash` still passes.
- `param-builder.test.ts` "simple query string" / "nested parameters" port their
  `assert_instance_of` lines and show 0 assertion-mismatch rows.
