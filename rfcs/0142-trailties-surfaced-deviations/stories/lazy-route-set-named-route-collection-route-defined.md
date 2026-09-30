---
title: "lazy-route-set-named-route-collection-route-defined"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

Rails' `LazyRouteSet#initialize` (`vendor/rails/v8.0.2/railties/lib/rails/engine/lazy_route_set.rb:49-54`)
starts with `self.named_routes = NamedRouteCollection.new`. That swaps in
`LazyRouteSet::NamedRouteCollection` (`:10-15`), whose `route_defined?(name)`
runs `Rails.application&.reload_routes_unless_loaded` and then calls `super`.

trails' `LazyRouteSet` (`packages/trailties/src/engine/lazy-route-set.ts`) has no
constructor and no nested `NamedRouteCollection`. It keeps the base
`RouteSet#namedRoutes` (`packages/actionpack/src/action-dispatch/routing/route-set.ts:670`),
so `routes.namedRoutes.isRouteDefined(name)` (`route-set.ts:543`) never triggers
the lazy reload.

## Acceptance criteria

- [ ] `LazyRouteSet.NamedRouteCollection` extends actionpack's `NamedRouteCollection`, and its `isRouteDefined` reloads before `super`, per `lazy_route_set.rb:10-15`.
- [ ] `LazyRouteSet`'s constructor assigns `this.namedRoutes = new LazyRouteSet.NamedRouteCollection()` after `super(config)`, per `:49-51`.
- [ ] A test shows that `isRouteDefined` on a lazy route set calls `reloadRoutesUnlessLoaded`.
