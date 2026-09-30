---
title: "Drop the routes commands' explicit reloadRoutesUnlessLoaded await once LazyRouteSet#routes reloads in-line"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR trails#8283 added `await Trails.application!.reloadRoutesUnlessLoaded()` after
`bootApplicationBang()` in the routes command (`packages/trailties/src/commands/routes.ts`,
action body) and in `UnusedRoutesCommand#perform`
(`packages/trailties/src/commands/unused-routes.ts`). Rails has no such call:
`RoutesCommand#perform` is `boot_application!` then `say inspector.format(...)`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/routes/routes_command.rb:20-33`).
The reload happens inside `Rails.application.routes.routes` via
`LazyRouteSet#routes` (`vendor/rails/v8.0.2/railties/lib/rails/engine/lazy_route_set.rb:86-89`),
which is synchronous in Ruby. In trails, `LazyRouteSet#routes` (a getter) can only
fire-and-forget the async reload, so the commands await it themselves. No receipt
tag covers an added call, so this deviation is tracked only here.

It depends on `converge-lazy-route-set-sync-ops-to-await-the-reload` (blocked): once
the reload can run synchronously, the `routes` getter draws the table in-line.

## Acceptance criteria

- [ ] The explicit `reloadRoutesUnlessLoaded()` awaits are gone from `routes.ts` and
      `unused-routes.ts`, and both `perform` bodies are `bootApplicationBang()`, then output,
      matching `routes_command.rb:20-25`.
- [ ] `commands/routes.trails.test.ts` and `commands/unused-routes.trails.test.ts`
      (boot-app `trails routes` / `routes -u`) stay green.
