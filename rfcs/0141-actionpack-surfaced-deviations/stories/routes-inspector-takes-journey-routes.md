---
title: "routes-inspector-takes-journey-routes"
status: done
updated: 2026-10-14
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8911
claim: "2026-10-14T20:03:51Z"
assignee: "routes-inspector-takes-journey-routes"
blocked-by: null
closed-reason: null
---

## Context

Rails' `RoutesInspector#initialize(routes)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/inspector.rb`) takes a
`Journey::Routes` (Enumerable) and every caller passes `app.routes.routes`
(`debug_exceptions.rb:194`, `railties/lib/rails/commands/routes/routes_command.rb`).
trails' `RoutesInspector` (`packages/actionpack/src/action-dispatch/routing/inspector.ts:113`)
takes `readonly Route[]`, so every caller adds a third `.routes`
(`DebugExceptions#routesInspector`, `inspector.test.ts:46`, `engine.trails.test.ts:60`,
`routing-source-location.trails.test.ts`).

## Acceptance criteria

- [ ] `RoutesInspector`'s constructor takes the Journey `Routes` and enumerates it the way
      `inspector.rb` does (`select`, `each`).
- [ ] Every caller passes `routeSet.routes`, as Rails' `app.routes.routes` does, with no
      trailing `.routes`.
