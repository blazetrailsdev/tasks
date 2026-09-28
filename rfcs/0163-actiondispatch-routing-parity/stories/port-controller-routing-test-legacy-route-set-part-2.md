---
title: "Port controller/routing_test.rb lines 500-1005 (rest of LegacyRouteSetTests)"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-controller-routing-test-legacy-route-set-part-1"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The rest of `LegacyRouteSetTests`
(`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:74-1005`):
Rails lines 500-1005 hold 18 empty skip stubs and 18 missing tests — 1 missing
and 17 skipped in 500-749, 17 missing and 1 skipped in 750-1005: named routes,
`root`, `recognize_path` with request methods, subpaths, constraint failures and
routes redrawn after `clear!` / eager loading.

## Acceptance criteria

- Each stub is replaced by the Rails body and each missing test ported, in Rails
  order.
