---
title: "withRoutesHelpers rejects a real RouteSet at the type level"
status: draft
updated: 2026-09-30
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

Surfaced in trails#8260. `withRoutesHelpers` (`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`), the port of `AbstractController::Railties::RoutesHelpers.with(routes, include_path_helpers = true)` (`actionpack/lib/abstract_controller/railties/routes_helpers.rb:10`), types its `routes` parameter as `UrlHelpersRouteSet`. That interface's `urlHelpers()` returns `HelperMethodsModule`, which is `Record<string, (...args: unknown[]) => unknown>` (`abstract-controller/helpers.ts:5`). A real `RouteSet#urlHelpers` returns `UrlHelpersModule` (`action-dispatch/routing/route-set.ts:655`), which has no string index signature. So passing an actual `RouteSet` fails to compile:

```text
error TS2345: Argument of type 'RouteSet' is not assignable to parameter of type 'UrlHelpersRouteSet'.
  Type 'UrlHelpersModule' is not assignable to type 'HelperMethodsModule'.
    Index signature for type 'string' is missing ...
```

In Rails, `with` takes `app.routes`, a `RouteSet` (`action_controller/railtie.rb:70`). The only production caller, `trailties/src/trailties/action-controller.ts:47-68`, compiles only because it types the app's routes as `AppRoutes = Parameters<typeof AbstractController.withRoutesHelpers>[0] & { mountedHelpers(): object }` rather than as `RouteSet`. The #8260 dispatch test (`scaffold-controller-generator.trails.test.ts`) had to switch to `include(klass, routes.urlHelpers())` to avoid the error.

## Acceptance criteria

- [ ] `withRoutesHelpers(routes)` accepts a real `RouteSet` without a cast. That means typing the parameter so that `RouteSet#urlHelpers(supports_path = true)` (`route_set.rb:530`) satisfies it, for example by returning `UrlHelpersModule` rather than `HelperMethodsModule`.
- [ ] `trailties/src/trailties/action-controller.ts` types the app's routes as the `RouteSet` it is, and the `AppRoutes` alias is deleted.
- [ ] A `.trails.test.ts` case calls `withRoutesHelpers(new RouteSet())` with no cast.
