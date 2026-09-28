---
title: "Port controller/routing_test.rb's RouteSetTest lines 1500-1994 and RackMountIntegrationTests"
status: draft
updated: 2026-09-27
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-controller-routing-test-route-set-part-1"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The rest of `vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb`:

- `RouteSetTest` (`:1007-1994`), Rails lines 1500-1994: 36 missing (15 in
  1500-1749, 21 in 1750-1994)
- `RackMountIntegrationTests` (`:1996-2196`): 5 missing

## Acceptance criteria

- The 41 tests are ported in Rails order under their Rails classes.
- `pnpm parity:test --package actioncontroller` reports
  `controller/routing_test.rb` 156/156 with 0 skipped.
