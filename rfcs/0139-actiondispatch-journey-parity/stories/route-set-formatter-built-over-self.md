---
title: "RouteSet#formatter is Journey::Formatter.new(self); drop the bridge adapter, per-add_route cache clear and Route#pathFor raise site"
status: draft
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds the formatter over the route set itself: `@formatter = Journey::Formatter.new self`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb:404`). `RouteSet#add_route`
stores the Journey route in `@set` (`@set.add_route(name, mapping)`, `route_set.rb:645-660`), and
`named_routes` holds those Journey routes. So `Formatter#named_routes` / `build_cache`
(`journey/formatter.rb:143-145,213-221`) read `routes.named_routes` and `routes.routes` straight off
the RouteSet. The formatter cache is cleared only in `clear!` (`route_set.rb:494`), never per
`add_route`.

trails#8164 routed `RouteSet#generate` through `Journey::Formatter`. But trails' `RouteSet` still
stores `Routing::Route`s (`packages/actionpack/src/action-dispatch/routing/route-set.ts`,
`private routes: Route[]`), so the `formatter` field is built over an object-literal adapter, not
`this`:

- `routes` is a getter that returns `set.journeyRouter.routes`, the Journey routes
  `routing/journey-bridge.ts` rebuilds from the local routes.
- `namedRoutes.get` maps a local named route to its Journey twin by position:
  `set.journeyRouter.routes.routes[set.routes.indexOf(route)]`.
- `addRoute` calls `this.formatter.clear()` beside `this._journeyRouter = null`, because each rebuild
  of the bridged router makes new Journey route objects.

Separately, `Routing::Route#pathFor` (`routing/route.ts`) still carries a second
`MissingRoute(...).path("pathFor")` raise site, whose constraints hash holds only the parameterized
parts. No production code calls it since #8164; only `routing/route.test.ts`,
`routing/route.trails.test.ts` and `dispatch/routing.test.ts` do.

## Acceptance criteria

- [ ] `RouteSet#formatter` is `new Journey::Formatter(this)`, as in `route_set.rb:404`. No adapter
      literal, with `routes` / `namedRoutes` answering Journey routes directly because `@set` and
      `named_routes` hold them.
- [ ] The positional `indexOf` local-to-Journey mapping is gone.
- [ ] `addRoute` no longer clears the formatter cache. It is cleared only by `clear!`, as in
      `route_set.rb:494`.
- [ ] `Routing::Route#pathFor` and its `MissingRoute` raise site are deleted, or reduced to the
      `Journey::Route#format` path. Its tests are ported to the Rails tests that cover formatting
      (`journey/route_test.rb`, `journey/router_test.rb`).
- [ ] `pnpm parity:api:calls` / `parity:api:extra --package actiondispatch` do not regress.
