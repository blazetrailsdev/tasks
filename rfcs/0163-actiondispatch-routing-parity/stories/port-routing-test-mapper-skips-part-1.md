---
title: "Port dispatch/routing_test.rb's skipped TestRoutingMapper tests, lines 31-1999"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "route-set-recognize-routing-test-rewrite-and-delete",
    "port-actionpack-abstract-unit-test-support",
  ]
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

`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` (5393 lines)
matches 293 of 294 tests by name in
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`, but 139 are
empty `it.skip("name", () => {})` stubs (e.g. `:1345-1347`, `:1485-1493`).
`TestRoutingMapper` (`:8-3971`) holds 87 of them. This story takes the 28 in
Rails lines 31-1999: 2 in 0-249, 1 in 250-499, 3 in 500-749, 1 each in 750-999
and 1000-1249, 2 in 1250-1499, 13 in 1500-1749 (`projects`, `projects
involvements`, `path option override`, scoped roots, format options) and 5 in
1750-1999.

These are integration tests: each draws routes with `draw do … end` and issues
`get "/path"`, asserting on `@response.body` and the URL helpers.

## Acceptance criteria

- Each of the 28 stubs is replaced by the Rails body, driven through the
  harness's `IntegrationTest` and Rails' routing seats (not `JourneyMatch`).
- A test that exposes a mapper bug stays `it.skip` only with the id of a filed
  story; each such story is filed before this one closes.
