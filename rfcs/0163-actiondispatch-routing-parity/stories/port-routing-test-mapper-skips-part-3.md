---
title: "Port dispatch/routing_test.rb's skipped TestRoutingMapper tests, lines 3250-3971"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-routing-test-mapper-skips-part-2"]
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

The last of `TestRoutingMapper`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:8-3971`): 39
empty skip stubs in Rails lines 3250-3971 — 13 in 3250-3499, 14 in 3500-3749 and
12 in 3750-3971.

## Acceptance criteria

- Each of the 39 stubs is replaced by the Rails body.
- `pnpm parity:test --package actiondispatch` reports no skipped
  `TestRoutingMapper` test.
