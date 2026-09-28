---
title: "Port routing_assertions_test.rb and Assertions::RoutingAssertions#with_routing"
status: ready
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-actionpack-abstract-unit-test-support"]
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

`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_assertions_test.rb` reports
4/33 in `pnpm parity:test --package actiondispatch`. 24 of the 29 missing tests
live in a shared module body (`:77-258`: `assert_generates`, `assert_recognizes`,
`assert_routing` with and without constraints, query strings, `:only_path`) that
Rails includes into more than one class. The other five are
`WithRoutingTest` (`:284-317`, 2), `RoutingAssertionsIntegrationTest` (`:303`),
`WithRoutingSettingsTest` (`:340`) and `WithRoutingResetTest` (`:348`).

The last five need the one missing method in `testing/assertions/routing.rb`
(`pnpm parity:api` 9/10): `RoutingAssertions#with_routing(config = nil, &block)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/routing.rb:125`),
plus its class-level twins in `WithIntegrationRouting` (`:22`, `:40`) and
`ClassMethods` (`:93`).

Two tests (`assert generates`, `assert routing`) currently sit in
`routing-assertions.test.ts` but belong to `controller/test_case_test.rb`; they
move in `port-test-case-test-requests-and-params`.

## Acceptance criteria

- `withRouting` exists on each Rails host, drawing a fresh route set for the
  block and restoring the original afterwards — in a `finally` that runs after
  an async block settles, not when it returns a promise.
- The module-body tests are ported once and included into each class that
  Rails includes them into, so the extractor's per-class count matches.
- `pnpm parity:test --package actiondispatch` reports
  `dispatch/routing_assertions_test.rb` 33/33.
