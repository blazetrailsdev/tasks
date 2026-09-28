---
title: "Port dispatch/routing_test.rb's skipped TestRoutingMapper tests, lines 2000-3249"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-routing-test-mapper-skips-part-1"]
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

Continuing `TestRoutingMapper` in
`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb`: 20 empty skip
stubs in Rails lines 2000-3249 — 1 in 2000-2249, 5 in 2250-2499, 3 in
2500-2749, 4 in 2750-2999 and 7 in 3000-3249.

## Acceptance criteria

- Each of the 20 stubs is replaced by the Rails body, as in part 1.
