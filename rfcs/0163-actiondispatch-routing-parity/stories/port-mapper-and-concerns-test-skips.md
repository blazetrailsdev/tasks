---
title: "Port mapper_test.rb's 9 skips and concerns_test.rb's 1 skip"
status: done
updated: 2026-10-12
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8837
claim: "2026-10-12T20:31:40Z"
assignee: "port-controller-routing-test-legacy-route-set-part-1"
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionpack/test/dispatch/mapper_test.rb`: `MapperTest`
  (`:38-216`) has 21 tests; 9 are empty skip stubs in
  `dispatch/mapper.test.ts`. They drive `Mapper` directly over a `FakeSet`
  (`MapperTest::FakeSet`, `:8`) and assert on the conditions, requirements and defaults `Mapping`
  builds — the surface `port-mapping-initialize-and-make-route` (RFC 0123, blocked)
  finishes.
- `vendor/rails/v8.0.2/actionpack/test/dispatch/routing/concerns_test.rb`:
  `RoutingConcernsTest` (`:46-103`), 1 skip of 11.

## Acceptance criteria

- The 10 stubs are real tests with Rails' bodies, including `FakeSet`. A test
  that needs the unfinished `Mapping#initialize` stays `it.skip` with
  `port-mapping-initialize-and-make-route` (blocked in RFC 0123) as its reason,
  so the rest do not wait on it.
- Both files report complete with 0 skipped.
