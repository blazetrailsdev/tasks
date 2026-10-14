---
title: "Port actionview's polymorphic_routes_test.rb, including PolymorphicPathRoutesTest's inherited run"
status: in-progress
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8891
claim: "2026-10-14T11:33:03Z"
assignee: "controller-routing-test-ts-only-tests-move-to-trails-sibling"
blocked-by: null
closed-reason: null
---

## Context

`test-compare-credits-tests-inherited-from-a-same-file-superclass` made the
Ruby extractor replay a same-file test superclass's tests under each subclass,
as Minitest runs them. `class PolymorphicPathRoutesTest <
PolymorphicRoutesTest`
(`vendor/rails/v8.0.2/actionview/test/activerecord/polymorphic_routes_test.rb:737`)
redefines `assert_url` to assert on `polymorphic_path` and inherits every test
of `PolymorphicRoutesTest` (`:72-735`), so `pnpm parity:test --package
actionview` now counts the file as 145 tests where it counted 73.

No test of the file is ported: `packages/actionview/src/activerecord/polymorphic-routes.test.ts`
does not exist, and no story covers it.

## Acceptance criteria

- [ ] `polymorphic_routes_test.rb` is ported, `PolymorphicRoutesTest` and
      `PolymorphicPathRoutesTest` each carrying the tests Rails runs under it.
- [ ] `pnpm parity:test --package actionview` reports
      `activerecord/polymorphic_routes_test.rb` 145/145, or the story is split
      and each part filed.
