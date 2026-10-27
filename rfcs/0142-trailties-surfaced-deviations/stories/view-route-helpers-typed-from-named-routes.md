---
title: "view-route-helpers-typed-from-named-routes"
status: draft
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to trails#9366. That PR writes `.trails/routes-augmentation.d.ts` from `namedRoutes.helperNames()` (Rails `NamedRouteCollection#helper_names`, `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb:102-104`) and augments `ActionController.Base`, `ActionController.API` and `IntegrationTest`. Rails also includes `routes.url_helpers` into views (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb`, `url_helpers` → `ActionView` via `_routes`). trails' view stand-ins instead get a permissive scope with `${string}Path` and `${string}Url` index signatures (`packages/trails-tsc/src/build-views.ts`, `templateScope`), so a misspelled helper in a `.tse` type-checks.

## Acceptance criteria

- [ ] `templateScope` types a view's route helpers from the same `helperNames()` list as the augmentation, and drops the `${string}Path` / `${string}Url` index signature.
- [ ] A `.tse` calling an undrawn helper fails `trails-tsc` with TS2339.
