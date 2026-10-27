---
title: "Build views loads routes through the reloader in a booted app"
status: in-progress
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#9382
claim: "2026-10-27T17:34:06Z"
assignee: "build-views-loads-routes-through-the-reloader"
blocked-by: null
closed-reason: null
---

# Build views loads routes through the reloader in a booted app

## Context

Since trails#9366, `buildViews` (`packages/trails-tsc/src/build-views.ts`)
loads `config/routes.ts` with `rbFLoad` so it can type named route helpers.
`trails server` runs `buildViews` in-process through `watchViews`, after
`Trails.initialize()`. In development the routes are still lazy at that point,
so the file's `draw` goes through `LazyRouteSet#draw`, which first calls
`reloadRoutesUnlessLoaded()`. That loads `config/routes.ts` through the
reloader (draw one); the outer `draw` then carries on (draw two), and
`RouteSet#addRoute` raises `Invalid route name, already in use: 'root'`.
`trails server` crashes at boot for any app with a named route (trailmap#83).

Rails loads routes only through the reloader: `Rails::Engine::LazyRouteSet#draw`
calls `Rails.application&.reload_routes_unless_loaded`
(`railties/lib/rails/engine/lazy_route_set.rb`), and commands that need the
table call `reload_routes_unless_loaded` rather than `load "config/routes.rb"`
(trails' own `commands/routes.ts:29` does the same).

## Acceptance criteria

- In an initialized application, `buildViews` loads routes with
  `application.reloadRoutesUnlessLoaded()`, never by loading the file.
- With an application that was never initialized (the standalone
  `trails-tsc-views build` CLI), it keeps loading `config/routes.ts`.
- A boot-app test runs `buildViews` after `Trails.initialize()` and asserts the
  named routes are drawn once, with no unhandled rejection.
