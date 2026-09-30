---
title: "port-routing-assertions-shared-tests-module"
status: ready
updated: 2026-09-30
rfc: "0160-actionpack-test-harness-parity"
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

`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_assertions_test.rb:19-229`
is the `RoutingAssertionsSharedTests` module: a `setup` (`:20-75`) that draws two
anonymous `Rails::Engine`s (`root_engine` mounted at `/`, `blog_engine` at
`/shelf`) and an `@routes` with `secure` / `block` / `query` constraint scopes,
plus 26 `def test_*` (`:77-229`: `assert_generates`, `assert_recognizes`,
`assert_routing` with defaults, extras, method, hash / lambda / query
constraints, engines, `:msg`, and `test_with_routing`). Rails includes it into
`RoutingAssertionsControllerTest` (`:278-279`) and
`RoutingAssertionsIntegrationTest` (`:300-301`); the extractor records each test
once with no ancestors.

`port-routing-assertions-test-and-with-routing` ported `with_routing` on all
three Rails hosts and every test outside this module, and split this module off
for size. Its test file
(`packages/actionpack/src/action-dispatch/dispatch/routing-assertions.test.ts`)
already has the `runTest` harness and the `WithRoutingSharedTests` shape — a
top-level function taking the host class, which the TS extractor defers and
records once, as Ruby does. The module ports the same way: `include(klass, { setup() {...} })`
for its `setup`, then the 26 `it`s, called from both describes.

Porting it was done and green locally before the split. It needs three trails
fixes the other tests did not:

- `RouteSet#recognizePathWithRequest`'s engine arm
  (`packages/actionpack/src/action-dispatch/routing/route-set.ts:1210-1213`)
  reads `rackApp().routes` as a property; Rails' `app.rack_app.routes`
  (`routing/route_set.rb:925`) is `Engine#routes`, which trails ports as a
  method (`packages/trailties/src/engine.ts:152`) — call `routes()`.
- The hand-rolled `Mapper#resources` (`routing/mapper.ts:905`, tracked by
  `mapper-resources-hand-builds-canonical-routes`) ignores `controller:`:
  Rails' `Resource#initialize` sets
  `@controller = (options[:controller] || @name).to_s` (`routing/mapper.rb:1190`).
- Its `addRouteToSet` hands every implicit name to `RouteSet#add_route`, which
  raises on the second `resources :articles` inside a path-only `scope`; Rails'
  `name_for_action` (`routing/mapper.rb:1931-1932`) drops an implicit name that
  `has_named_route?` already holds.

The module also replaces the four stand-in tests at the top of that file
(`assert generates`, `assert recognizes`, `assert routing`, `with routing`),
which only share the names.

## Acceptance criteria

- `RoutingAssertionsSharedTests` is one top-level function in the test file,
  with Rails' `setup` and 26 tests in source order, called from
  `RoutingAssertionsControllerTest` and `RoutingAssertionsIntegrationTest`.
- The three trails fixes above land at the cited Rails shapes.
- The four stand-in tests are gone.
- `pnpm parity:test --package actiondispatch` reports
  `dispatch/routing_assertions_test.rb` 33/33.
