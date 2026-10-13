---
title: "Port controller/routing_test.rb's RouteSetTest, lines 1007-1205"
status: done
updated: 2026-10-13
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-controller-routing-test-legacy-route-set-part-1"]
deps-rfc: []
est-loc: 330
priority: null
pr: trails#8859
claim: "2026-10-13T14:04:46Z"
assignee: "port-controller-routing-test-legacy-route-set-part-2"
blocked-by: null
closed-reason: null
---

## Context

`RouteSetTest < ActiveSupport::TestCase`
(`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:1007-1994`) has
76 tests; 72 are missing from `controller/routing.test.ts`. This story takes the
19 in Rails lines 1007-1205: `generate_extras` / `extra_keys`, `draw` and named
draws, and the named-route `*_url` method with anchor, port, host, protocol and
ordered parameters.

It was first scoped to lines 1007-1499 (36 tests). The PR LOC ceiling cut the
17 tests in lines 1207-1490, which `port-controller-routing-test-route-set-part-1b`
now carries.

## Acceptance criteria

- The 19 tests are ported in Rails order under `describe("RouteSetTest")`.
