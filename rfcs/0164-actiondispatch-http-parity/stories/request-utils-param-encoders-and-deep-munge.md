---
title: "Port Request::Utils as a class with ParamEncoder, NoNilParamEncoder and CustomParamEncoder"
status: draft
updated: 2026-09-28
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "http-config-seats-onto-mattr-accessor",
    "wire-parameter-encoding-onto-metal-action-encoding-template",
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Request::Utils`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/request/utils.rb`) is a
class (`:9`) holding `perform_deep_munge` (`:10`), `normalize_encode_params`
(`:23`), `check_param_encoding` (`:31`) and three nested encoders:
`ParamEncoder` with `normalize_encode_params` (`:52`) and `handle_array`
(`:71`); `NoNilParamEncoder < ParamEncoder` (`:77`), whose `handle_array`
compacts `nil`s; and `CustomParamEncoder` with `encode_for_template` (`:86`)
and `encode(request, params, controller, action)` (`:101`), which reads the
controller's `action_encoding_template`.

`pnpm parity:api` reports `request/utils.rb` 7/12 and an inheritance row
("`Utils` class missing"). `pnpm parity:api:extra` lists `RequestUtils` and
`deepMunge` on `packages/actionpack/src/action-dispatch/request/utils.ts` as
novel: trails has an object with a `deepMunge` function where Rails selects an
encoder by `perform_deep_munge`.

## Acceptance criteria

- `Request.Utils` is a class with Rails' members and nested encoders at Rails'
  names; `deepMunge` and `RequestUtils` are gone.
- `ParamBuilder` / `Request#params` choose the encoder as Rails does.
- `pnpm parity:api` reports `request/utils.rb` 12/12 with no inheritance row.
