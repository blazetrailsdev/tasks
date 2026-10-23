---
title: "IntegrationTest#_routes reads app.routes as a field; Rails calls app.routes"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails reads an integration app's routes with a method call:
`app.routes.url_helpers` / `mounted_helpers` in `create_session`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:366-368`)
and `@app.routes.default_url_options` in `url_options` (`:144-145`).

trails' `IntegrationTest` (`packages/actionpack/src/action-dispatch/testing/integration.ts`)
now calls `routes` in both of those: `urlOptions` (`:261-262`) and `createSession`
(`:478-479`) use `rbFSend(app, "routes")`. One reader still takes the field: the
`_routes` getter (`:703-706`), `app?.routes instanceof RouteSet ? app.routes._routes : …`.
For a booted trails application, whose `Engine#routes` is a method
(`packages/trailties/src/engine.ts`), that getter silently falls back to the session's
own routes.

Per CLAUDE.md § "A dispatch by name is spelled directly", the two `rbFSend(app, "routes")`
calls are sends with a literal name; the converged shape is `app.routes()` on an `app`
typed to answer it.

## Acceptance criteria

- The `_routes` getter reads `app.routes()`, as the other two readers do.
- All three readers spell `app.routes()` directly on a typed `app`, not
  `rbFSend(app, "routes")`; actionpack's test apps (`test-helpers/abstract-unit.ts` and the
  hand-rolled `{ routes, call }` apps) expose `routes` as a method.
- A booted application's routes reach `_routes`, with a test in
  `packages/trailties/src/boot-app-test-help.trails.test.ts`.
