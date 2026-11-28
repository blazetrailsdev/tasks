---
title: "routes-helpers-with-records-subclass-include-in-ancestry"
status: in-progress
updated: 2026-11-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10868
claim: "2026-11-28T14:21:06Z"
assignee: "routes-helpers-with-records-subclass-include-in-ancestry"
blocked-by: null
closed-reason: null
---

## Context

`RoutesHelpers.with` (`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/railties/routes_helpers.rb:10-21`) defines `inherited` so each subclass runs `klass.include(routes.url_helpers(include_path_helpers))`. That makes `FooController < url_helpers_module` true while `ActionController::Base < url_helpers_module` stays false (`vendor/rails/v8.0.2/actionpack/test/controller/route_helpers_test.rb:13-33`).

After trails#10167, `packages/actionpack/lib/abstract-controller/trailties/routes-helpers.ts` copies the helper descriptors onto the wired class's prototype (`Base.prototype`), and those descriptors answer only for subclasses. Nothing is recorded in the ancestry, though: ruby-compat's `classSearchAncestor` / `rbModAncestors` (`packages/ruby-compat/lib/include.ts:1084-1243`) read only the `includedModules` set on each prototype. So `rbClassInheritedP(FooController, SharedTestRoutes.namedRoutes.urlHelpersModule)` answers `null`. The deferred `inherited` hook (`DescendantsTracker.registerSubclass`) never fires for a bare `class FooController extends ApplicationController {}`, so the include can't be run at subclass time either.

## Acceptance criteria

- `rbClassInheritedP(Sub, routes.urlHelpers())`, plus the path/url helpers modules it includes, answers `true` for every subclass of a class wired with `RoutesHelpers.with`, and does not answer `true` for the wired class itself.
- `rbModAncestors(Sub)` lists the url-helpers module once.
- **Ruling (operator, 2026-11-27): an "included for subclasses" record.** `RoutesHelpers.with` records the url-helpers module on the wired class's prototype as included-for-subclasses (alongside, not in, `includedModules`). `classSearchAncestor` / `rbModAncestors` in `packages/ruby-compat/lib/include.ts` honour that record only when the walk entered from a subclass, never for the wired class itself. No constructor or `inherited` hook.
- This unblocks `unskip-route-helpers-test`.
