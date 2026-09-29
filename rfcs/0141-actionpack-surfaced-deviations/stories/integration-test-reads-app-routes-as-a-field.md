---
title: "IntegrationTest reads app.routes as a field; Rails calls app.routes (integration.rb:144,366)"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
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

Rails reads an integration app's routes with a method call:
`if app.respond_to?(:routes) && app.routes.is_a?(ActionDispatch::Routing::RouteSet)`
then `include app.routes.url_helpers` / `app.routes.mounted_helpers`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:366-368`,
`create_session`). It does the same in `url_options`
(`@app.routes.default_url_options`, `:144-145`).

trails' `IntegrationTest` (`packages/actionpack/src/action-dispatch/testing/integration.ts`)
has two arms. The constructor does
`typeof app?.routes === "function" ? app.routes() : app?.routes` (trails#8253),
because `Engine#routes` is a method (`packages/trailties/src/engine.ts`), while
actionpack's own test apps expose `routes` as a `RouteSet` field. `urlOptions`
(`app!.routes!.defaultUrlOptions`) and the `_routes` getter
(`app?.routes instanceof RouteSet`) still read only the field. For a booted
trails application, both silently fall back to the session's own `routes`.

## Converged shape

Every reader calls `app.routes()` as Rails does. actionpack's test apps
(`packages/actionpack/src/test-helpers/abstract-unit.ts` and the hand-rolled
`{ routes, call }` apps in actionpack tests) expose `routes` as a method, so the
property arm is deleted.

## Acceptance criteria

- `IntegrationTest`'s constructor, `urlOptions` and `_routes` read `app.routes()` only.
- A booted application's `default_url_options` reach `urlOptions`, with a test in
  `packages/trailties/src/boot-app-test-help.trails.test.ts`.
