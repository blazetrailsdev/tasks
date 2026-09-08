---
title: "mapper-drops-its-own-routes-buffer"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
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

Rails' `Mapper` holds no route collection of its own: `match_route` ends at
`@set.add_route(mapping, as)`
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:2062`) and the
set is the only registry. trails' `Mapper` still declares
`readonly routes: Route[] = []`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`), a buffer with no
Ruby counterpart.

As of #7630 the buffer is no longer load-bearing for registration — each route
reaches the set at its declaring line, mirroring `mapper.rb:2062`, and
`RouteSet#evalBlock`'s flush loop is gone. What keeps the field alive is the
private `addRouteToSet` choke point that fills it alongside the set call, which
exists solely because ~40 assertions in
`packages/actionpack/src/action-dispatch/routing/mapper.test.ts` and
`dispatch/mapper.test.ts` construct a setless `new Mapper()` and read
`m.routes` back. Rails' own mapper tests build a `Mapper` over a real
`ActionDispatch::Routing::RouteSet` and assert against `@set.routes`
(`vendor/rails/actionpack/test/dispatch/mapper_test.rb:9-24`, whose `FakeSet`
implements `add_route`).

## Acceptance criteria

- [ ] `Mapper#routes` and the private `addRouteToSet` helper are gone; route
      construction calls `this._set.addRoute(route, route.name)` directly, as
      `match_route` does.
- [ ] The setless-`Mapper` tests are rebuilt over a set — either the real
      `RouteSet` or a `FakeSet` mirroring `mapper_test.rb:9-24` — and assert
      against the set's routes.
- [ ] `pnpm parity:api:extra --package actiondispatch` novel count drops by the
      `routes` field; `pnpm parity:test --package actiondispatch` non-regressing.
