---
title: "trailties: LazyRouteSet prefetches the routes file, then draws synchronously"
status: draft
updated: 2026-10-08
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "actionpack"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Replaces `converge-lazy-route-set-sync-ops-to-await-the-reload`, closed as
FALSIFIED in the 2026-10-08 blocked-story triage: awaiting the reload inside
the synchronous operations is unreachable.

`Rails::Engine::LazyRouteSet`
(`vendor/rails/v8.0.2/railties/lib/rails/engine/lazy_route_set.rb:12-104`)
overrides `recognize_path`, `generate_extras`, `draw` and the url helpers to
call `Rails.application.reload_routes_unless_loaded` first, synchronously.
trails' reload is async only because `RoutesReloader` loads `config/routes.ts`
through `import()`, which has no synchronous form in ESM
(`packages/trailties/src/application/routes-reloader.ts:44`). A
Promise-returning override of `recognizePath` / `generateExtras` is TS2416, and
making them async in actionpack cascades through `url_for` and
`polymorphic_url`.

CLAUDE.md lists `lazy_route_set.rb` as not converged, with
`lazy-route-set-method-missing-resends-in-line` tracking the re-send.

## Acceptance criteria

- The routes-file load is split: an awaited prefetch of the module at
  `set_routes_reloader_hook`, and a synchronous draw from the prefetched
  module.
- `execute_unless_loaded` runs synchronously, so `recognizePath`,
  `generateExtras` and the url helpers keep their Rails return types.
- `drop-routes-commands-explicit-route-reload-await` and
  `lazy-route-set-method-missing-resends-in-line`, which depended on the closed
  story, are re-pointed at this one.
