---
title: "request-drops-mime-and-params-adapter-hosts"
status: claimed
updated: 2026-10-14
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-14T23:53:08Z"
assignee: "port-request-test-skips"
blocked-by: null
closed-reason: null
---

# Request calls MimeNegotiation and Parameters through adapter hosts instead of on self

## Context

`packages/actionpack/src/action-dispatch/http/request.ts` still routes module
bodies through synthetic hosts:

- `mimeHost(req)` builds a WeakMap-cached `Object.create(MimeNegotiation.prototype)`.
  `format`, `formats`, `variant`, `contentMimeType`, `accepts`, `negotiateMime`,
  `validAcceptHeader`, `useAcceptHeader`, `formatFromPathExtension` and
  `shouldApplyVaryHeader` are invoked on it.
- `_paramsHost` builds a per-call `ParametersHost` with an `Http::Parameters`
  prototype for `pathParameters`, `paramsParsers`, `parseFormattedParameters`
  and `logParseErrorOnce`.
- `get parameters()` reads an invented `action_dispatch.request.parameters_override`
  env key. Rails has only `alias :params :parameters`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/parameters.rb:52-65`).

Rails includes both modules into `Request`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:21-30`), so
every body runs on `self`. `setFormat`, `isParamsReadable` and `params` were
converged this way in trails#8916.

## Acceptance criteria

- The remaining MimeNegotiation and Parameters members are assigned onto or
  included into `Request` and called with `this`. `mimeHost` and `_paramsHost`
  are deleted.
- `parameters` is Rails' `parameters`, and `params` is its alias. The
  `parameters_override` key is removed, and its callers write
  `action_dispatch.request.parameters` the way Rails' test helpers do.
