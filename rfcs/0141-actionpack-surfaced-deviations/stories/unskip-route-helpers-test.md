---
title: "Unskip route_helpers_test.rb once url helpers are included into controllers"
status: blocked
updated: 2026-11-16
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps:
  - with-routes-helpers-answers-the-wired-class-itself
  - routes-helpers-with-records-subclass-include-in-ancestry
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-11-16T11:06:33Z"
assignee: "unskip-route-helpers-test"
blocked-by: "waiting on routes-helpers-with-records-subclass-include-in-ancestry: trails#10167 gates the helpers to subclasses but records no ancestry, so rbClassInheritedP(FooController, urlHelpersModule) is null"
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/controller/route-helpers.test.ts` (trails#8924) ports `vendor/rails/v8.0.2/actionpack/test/controller/route_helpers_test.rb:13-33` in full. It is parked as `it.skip` because `withRoutesHelpers` (`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`) answers url helpers through a prototype Proxy, where `RoutesHelpers.with` (`abstract_controller/railties/routes_helpers.rb:7-24`) does `klass.include(routes.url_helpers)` in `inherited`. As a result, `FooController < url_helpers_module` is nil.

## Acceptance criteria

- Once `with-routes-helpers-answers-the-wired-class-itself` converges, `only includes one module with route helpers` runs un-skipped with Rails' body.
- route_helpers_test.rb reports 1/1 with 0 skipped.
