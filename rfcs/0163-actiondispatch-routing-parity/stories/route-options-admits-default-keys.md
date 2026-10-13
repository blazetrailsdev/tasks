---
title: "RouteOptions admits the default keys Rails' option hash admits (two casts in routing.test.ts)"
status: done
updated: 2026-10-13
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8868
claim: "2026-10-13T20:45:43Z"
assignee: "activerecord-test-case-remaining-members-and-one-test-object"
blocked-by: null
closed-reason: null
---

## Context

Rails' route options are an open Hash: a key `match` does not consume becomes
a default. `test_default_string_params_with_match` draws
`match "/", to: "pages#show", via: :get, id: "home"`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:1893-1900`) and
`test_default_string_params_with_root` draws `root to: "pages#show", id: "home"`
(`:1911-1918`).

`RouteOptions` in `packages/actionpack/src/action-dispatch/routing/mapper.ts`
is a closed interface, so the two ports in
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts` cast their
options `as RouteOptions`. The mapper already treats the extra key as a
default at run time; only the type rejects it.

## Acceptance criteria

- [ ] `RouteOptions` admits a default key Rails' option hash admits, without
      weakening the typed keys.
- [ ] The two `as RouteOptions` casts in `routing.test.ts` are deleted.
