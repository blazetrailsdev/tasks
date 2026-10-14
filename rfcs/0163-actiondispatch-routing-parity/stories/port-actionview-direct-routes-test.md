---
title: "port-actionview-direct-routes-test"
status: ready
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/test/activerecord/polymorphic_routes_test.rb:750-796`
is `DirectRoutesTest < ActionView::TestCase`, one test (`test_direct_routes`),
the last test of the file. `polymorphic-routes.test.ts` ports every other
class of the file (144/145). It was left out of
`port-actionview-polymorphic-routes-test-part-2` because `ActionView::TestCase`
(`actionview/lib/action_view/test_case.rb`) has no trails port: the test needs
its `@controller` (`TestController`, request host `test.host`) and
`@controller.singleton_class.include Routes.url_helpers` (`:785`).

## Acceptance criteria

- `DirectRoutesTest > direct routes` runs in
  `packages/actionview/src/activerecord/polymorphic-routes.test.ts` with Rails'
  body, built on a ported `ActionView::TestCase` (not an ActionController one).
- `pnpm parity:test --package actionview` reports the file 145/145.
