---
title: "ActionDispatch::Routing::Route is a trails invention; fold it into Journey::Route, Mapper::Mapping and RouteSet"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
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

`packages/actionpack/src/action-dispatch/routing/route.ts` defines a
`Route` class under `ActionDispatch::Routing`. Rails has no
`action_dispatch/routing/route.rb` — `ls vendor/rails/actionpack/lib/action_dispatch/routing/`
is `endpoint.rb`, `inspector.rb`, `mapper.rb`, `polymorphic_routes.rb`,
`redirection.rb`, `route_set.rb`, `routes_proxy.rb`, `url_for.rb`. The whole
class is trails-only surface.

Rails splits the same job three ways:

- `ActionDispatch::Journey::Route`
  (`vendor/rails/actionpack/lib/action_dispatch/journey/route.rb:8`) is the only
  Route class: it holds `name`, `app`, `path`, `defaults`, `constraints`,
  `required_defaults` and answers `format`, `matches?`, `ip`, `verb`, `score`.
- `Mapper::Mapping` (`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:82`)
  turns the drawn options into the arguments for one.
- `RouteSet#add_route` (`vendor/rails/actionpack/lib/action_dispatch/routing/route_set.rb:531`)
  constructs it through `Journey::Routes#add_route` and owns the recognition and
  generation entry points.

Surfaced by #7609. Its tests had been written under `journey/route_test.rb`'s
Rails test names inside a `describe("TestRoute")` in
`dispatch/routing.test.ts`, colliding with the real `Journey::Route` copy in the
convention file; #7609 moved the block verbatim to
`packages/actionpack/src/action-dispatch/routing/route.trails.test.ts` so the
Journey rows could reach 11/11, but the invented class it covers is untouched.
The per-member convergence stories already filed against this RFC
(`journey-route-verb-carries-all-sentinel`,
`journey-route-app-seated-after-construction`, …) fix behaviours inside the
class; this story is the class itself.

## Acceptance criteria

- `routing/route.ts`'s responsibilities land on the three Rails seats above:
  construction/options handling in `Mapper::Mapping`, the route object itself in
  `Journey::Route`, recognition and generation in `RouteSet`/`Journey::Router`.
  No new members are added to `Journey::Route` that Rails does not have.
- `packages/actionpack/src/action-dispatch/routing/route.ts` is deleted, and with
  it `routing/route.trails.test.ts` — each of its 11 tests either has a Rails
  counterpart it now credits, or is dropped because the behaviour it covered was
  the invention.
- `pnpm parity:api:extra --package actionpack` no longer lists the class's names,
  and `pnpm parity:test --package actiondispatch` does not regress
  `journey/route_test.rb` (11/11) or `dispatch/routing/route_set_test.rb`.
- Every call site inside `actionpack` (`dispatch/routing.test.ts` alone
  constructs it ~10 times) moves to the Rails seat rather than to a shim.
- `Journey::Route#app` is passed to the constructor through
  `Journey::Routes#add_route` (`journey/routes.rb:60`) rather than seated after
  construction by `RouteSet#addRoute`, so a `Route` built outside a `RouteSet`
  is never `app === undefined` and `RouteWrapper#app`'s `!` assertion goes.
  Carried from `journey-route-app-seated-after-construction`, subsumed by this
  story on 0104's sunset.
