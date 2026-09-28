---
title: "Port controller/routing_test.rb's RouteSetTest, lines 1007-1499"
status: draft
updated: 2026-09-27
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

`RouteSetTest < ActiveSupport::TestCase`
(`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:1007-1994`) has
76 tests; 72 are missing from `controller/routing.test.ts`. This story takes the
36 in Rails lines 1007-1499 (20 in 1000-1249, 16 in 1250-1499):
`generate_extras` / `extra_keys`, `draw` and named draws, the named-route
`*_url` method with anchor, port, host, protocol and ordered parameters,
route constraints with anchors and `OPTIONS`, `recognize` with encoded ids,
HTTP methods and aliases, `root`, and `namespace` with path prefixes.

## Acceptance criteria

- The 36 tests are ported in Rails order under `describe("RouteSetTest")`.
