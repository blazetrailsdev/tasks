---
title: "RoutesReloader#executeUnlessLoaded lets a concurrent caller return before the pending load draws"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `RoutesReloader#execute_unless_loaded` (`vendor/rails/v8.0.2/railties/lib/rails/application/routes_reloader.rb:37-43`)
runs `execute`, and `execute` sets `@loaded = true` and then runs the updater
synchronously. When `execute_unless_loaded` returns, the routes are drawn. No
second caller can see `@loaded` set while the draw is still pending.

trails' `RoutesReloader` (`packages/trailties/src/application/routes-reloader.ts:41-54`)
sets `this.loaded = true` in `execute()` before `await this.updater().execute()`,
which runs the async `reloadBang` (`import()` of `config/routes.ts`). So a second
`executeUnlessLoaded()` that arrives while the first is pending sees
`loaded === true` and resolves `null` at once, without waiting for the draw.

Since trails#8280, `LazyRouteSet`'s `method_missing_module` trap
(`packages/trailties/src/engine/lazy-route-set.ts`) and the other sync overrides
start the reload with `void`. After that, `LazyRouteSet#call`'s
`await reloadRoutesUnlessLoaded()` can return while the route table is still
undrawn, and `super.call` then routes against empty routes. The same race
reaches test_help's integration `before_setup` await.

The converged shape: a caller of `executeUnlessLoaded` does not settle before
the routes are drawn. The first caller's pending load is shared with any
concurrent caller (for example `@loaded` holds the in-flight promise). This
keeps Rails' contract that a returned `execute_unless_loaded` means the routes
are drawn, and it still answers `true` only to the caller that loaded.

## Acceptance criteria

- [ ] A second `executeUnlessLoaded()` issued while the first is pending does not resolve before the first one's `execute()` has settled.
- [ ] The first caller still resolves `true` and a later caller `null`, per `routes_reloader.rb:37-43`.
- [ ] A test starts a `void` reload through `LazyRouteSet` (for example a missed url-helper read), then awaits `LazyRouteSet#call`, and gets a drawn route rather than a 404.
