---
title: "wire-lazy-route-set-reload-hook"
status: done
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7390
claim: "2026-09-02T13:27:56Z"
assignee: "converge-routeset-call-to-journey-router-serve"
blocked-by: null
closed-reason: null
---

## Context

`Engine`'s `make_routes_lazy` initializer
(`vendor/rails/railties/lib/rails/engine.rb:591-593`) is
`config.route_set_class = LazyRouteSet if Rails.env.local?`. It was left out of
the `port-remaining-engine-initializers` PR because selecting `LazyRouteSet`
today breaks boot:

- `Finisher`'s `set_routes_reloader_hook`
  (`packages/trailties/src/application/finisher.ts:178`) mirrors Rails in
  skipping the eager `executeUnlessLoaded` when `app.routes` is a
  `LazyRouteSet` (`application/finisher.rb:164-177`).
- The lazy path then relies on
  `Rails.application&.reload_routes_unless_loaded`
  (`railties/lib/rails/engine/lazy_route_set.rb:12-104`, `application.rb`'s
  `reload_routes_unless_loaded` → `routes_reloader.execute_unless_loaded`).
  Trails has neither: `Application#reloadRoutesUnlessLoaded` is unported and
  `lazy-route-set.ts`'s `setReloadRoutesHook` seam defaults to a no-op that
  nobody sets.
- The seam is also the wrong shape: `RoutesReloader#executeUnlessLoaded`
  (`packages/trailties/src/application/routes-reloader.ts:52`) is `async`,
  while every `LazyRouteSet` call site that consults the hook is synchronous.

With the initializer enabled and nothing wiring the hook, the boot-app
integration tests 404 (routes are never drawn).

Groundwork already landed: `RouteSet.newWithConfig` now does `new this(merged)`
(the `self.new` of `route_set.rb:365-381`), so
`LazyRouteSet.newWithConfig` builds a `LazyRouteSet`.

## Acceptance criteria

- `Application#reloadRoutesUnlessLoaded` is ported
  (`railties/lib/rails/application.rb`) and wired as `LazyRouteSet`'s reload
  hook, replacing the `setReloadRoutesHook` / `resetReloadRoutesHook`
  `@noRailsEquivalent CONVERGEABLE` seam.
- The sync/async mismatch between `executeUnlessLoaded` and the synchronous
  `LazyRouteSet` routing ops is resolved (or the blocker is recorded with
  `tasks block`).
- `Engine`'s `make_routes_lazy` initializer is declared at
  `engine.rb:591-593`'s Rails name, in Rails declaration order (between
  `set_eager_load_paths` and `add_routing_paths`), and the entry for it is
  removed from `engine.ts`'s skipped-initializers header comment.
- The boot-app integration tests in
  `packages/trailties/src/application.test.ts` stay green with the lazy route
  set selected.
