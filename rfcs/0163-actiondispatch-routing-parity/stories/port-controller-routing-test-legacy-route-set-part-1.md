---
title: "Port controller/routing_test.rb lines 1-499 (UriReserved and LegacyRouteSetTests)"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps:
  ["port-actionpack-abstract-unit-test-support", "port-abstract-unit-routing-and-assertion-helpers"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb` (2196 lines,
151 tests plus 5 in a shared module) reports 23/156 in
`pnpm parity:test --package actioncontroller`, with 37 empty skip stubs in
`packages/actionpack/src/action-controller/controller/routing.test.ts` and 96
missing. This story takes Rails lines 1-499:

- `UriReservedCharactersRoutingTest` (`:14-72`): 2 skips
- `LegacyRouteSetTests` (`:74-1005`) up to line 499: 17 skips and 1 missing

`LegacyRouteSetTests` uses `RoutingTestHelpers` / `TestSet`
(`test/abstract_unit.rb:305-349`) and `ActionDispatch::RoutingVerbs`
(`:260-303`).

## Acceptance criteria

- Each stub is replaced by the Rails body and the missing test ported, in Rails
  order, on the harness helpers.
