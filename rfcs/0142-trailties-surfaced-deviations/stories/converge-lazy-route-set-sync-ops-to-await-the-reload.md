---
title: "converge-lazy-route-set-sync-ops-to-await-the-reload"
status: blocked
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: "boot"
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: "2026-09-25T14:19:29Z"
assignee: "converge-generator-class-name-on-camelize"
blocked-by: "RouteSet#recognize_path/generate_extras/draw and the url helpers are synchronous Rails APIs overridden by LazyRouteSet; TS2416 rejects a Promise-returning override of recognizePath/generateExtras, and making them async in actionpack cascades through url_for/polymorphic_url like to_sql. The reload is async only because RoutesReloader loads config/routes.ts via import(), which has no sync form in ESM. Unblock path: split the routes-file load into an awaited prefetch at set_routes_reloader_hook plus a sync draw so execute_unless_loaded can run synchronously (routes-reloader.ts:44, lazy_route_set.rb:12-104)."
closed-reason: null
---

## Context

`Rails::Engine::LazyRouteSet` calls `Rails.application&.reload_routes_unless_loaded`
at the top of every routing op (`railties/lib/rails/engine/lazy_route_set.rb:12-104`),
and in Ruby that call is synchronous — by the time `super` runs, the route table
is drawn.

In trails, `Application#reloadRoutesUnlessLoaded`
(`packages/trailties/src/application.ts:316`) is `async`, because
`RoutesReloader#executeUnlessLoaded`
(`packages/trailties/src/application/routes-reloader.ts:52`) loads
`config/routes.ts` through a dynamic `import()`.

`wire-lazy-route-set-reload-hook` converged the boot-critical path:
`LazyRouteSet#call` (`engine/lazy-route-set.ts`) is `async` and `await`s the
reload before `super.call`, which is what makes the boot-app integration tests
green. The remaining synchronous overrides — `draw`, `generateExtras`,
`recognizePath`, `recognizePathWithRequest`, and the five wrapped url helpers in
`generateUrlHelpers` — make the same call but cannot `await` it, so they run
`super` against a possibly-undrawn route table.

## Acceptance criteria

- Every `LazyRouteSet` routing op observes a drawn route table before it calls
  `super`, or the ops that cannot are converged to an awaitable trails shape
  (the settled `setX()`-style idiom for a Ruby method that must be async).
- The `void reloadRoutesUnlessLoaded()` calls and the paragraph in
  `engine/lazy-route-set.ts`'s header comment that points at this story are gone.
