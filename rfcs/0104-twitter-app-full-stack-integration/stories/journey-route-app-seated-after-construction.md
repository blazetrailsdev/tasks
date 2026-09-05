---
title: "Journey::Route#app is seated by RouteSet#addRoute instead of passed to the constructor"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds a route's endpoint in the mapper and passes it to the route's
constructor: `Mapping#app` wraps the `to:` (or the dispatcher) in a
`Routing::Mapper::Constraints`
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:295-303`), and
that object reaches `Journey::Route.new(..., app:)` through
`Journey::Routes#add_route` (`vendor/rails/actionpack/lib/action_dispatch/journey/routes.rb:60`),
where it is read back as `Journey::Route#app`
(`vendor/rails/actionpack/lib/action_dispatch/journey/route.rb:56`).

PR #7520 needed `Route#app` so `RouteWrapper#endpoint` could ask
`app.dispatcher?` (`routing/inspector.rb:17-26`). It could not construct the
endpoint in `Route`: the `Dispatcher` is defined in
`packages/actionpack/src/action-dispatch/routing/route-set.ts`, and
`route.ts` importing `route-set.ts` closes a module cycle over
`class StaticDispatcher extends Dispatcher`, which is the TDZ shape CLAUDE.md's
"Call-time constant resolution" section describes.

So the endpoint is seated _after_ construction instead: `Route#app` is a
getter/setter pair and `RouteSet#addRoute`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts`) assigns
`mapping.app = this._app(mapping)` before pushing the route. The mount target
the mapper passed moved to `Route#to` (`@internal`), mirroring `Mapping#to`
(`mapper.rb:83-91`).

The consequence is that a `Route` constructed outside a `RouteSet` has
`app === undefined`, so `RouteWrapper#app` reads `this.route.app!` and an
inspector handed a loose route throws where Rails would not.

## Converged shape

Move the endpoint construction to where Rails has it — the mapper — and pass it
through `RouteOptions`, so `Route#app` is a `readonly` field set in the
constructor and the setter disappears. The `Dispatcher` reference that closes
the cycle goes through a zero-import slot module, the sanctioned shape for
exactly this (CLAUDE.md, "Call-time constant resolution"; see
`packages/actionpack/src/action-dispatch/routing/../../..` siblings such as
`trailties/src/trails-slot.ts`).

Verify both import directions with a plain-node import of the built `dist/**.js`
entry modules — a vitest run enters the funnel module first and masks the TDZ.

## Acceptance criteria

- [ ] `Route#app` is set at construction from `RouteOptions`, matching
      `journey/routes.rb:60` + `journey/route.rb:56`; the public setter is gone.
- [ ] `RouteSet#addRoute` no longer assigns the app post-hoc.
- [ ] `RouteWrapper#app` reads `route.app` without a non-null assertion.
- [ ] A plain-node import of the built `route.js` and `route-set.js` as entry
      modules succeeds in both orders.
