---
title: "port-actionview-polymorphic-routes-test-part-2"
status: in-progress
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps:
  - port-actionview-polymorphic-routes-test-part-1
deps-rfc: []
est-loc: null
priority: 2
pr: trails#8912
claim: "2026-10-14T19:41:04Z"
assignee: "port-actionview-polymorphic-routes-test-part-2"
blocked-by: null
closed-reason: null
---

## Context

Split from `port-actionview-polymorphic-routes-test`; depends on
`port-actionview-polymorphic-routes-test-part-1`, which ports the harness of
`vendor/rails/v8.0.2/actionview/test/activerecord/polymorphic_routes_test.rb`
and tests `:93-371`.

This part ports the rest of `PolymorphicRoutesTest`, `test_class_with_array_and_namespace`
(`:373`) through `test_string_route_arguments` (`:621-635`), then
`PolymorphicPathRoutesTest < PolymorphicRoutesTest` (`:737-748`), which
redefines `assert_url` to assert on `polymorphic_path` and inherits every
test (test-compare replays them, so the file counts 145 tests), and
`DirectRoutesTest` (`:750-796`).

## Acceptance criteria

- [ ] `pnpm parity:test --package actionview` reports
      `activerecord/polymorphic_routes_test.rb` 145/145 (with part 1).
- [ ] `PolymorphicPathRoutesTest` runs each inherited test with its own
      `assert_url`, not a copy of the bodies.
