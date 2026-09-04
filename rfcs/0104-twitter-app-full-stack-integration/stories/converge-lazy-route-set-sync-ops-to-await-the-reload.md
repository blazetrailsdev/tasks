---
title: "converge-lazy-route-set-sync-ops-to-await-the-reload"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
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
