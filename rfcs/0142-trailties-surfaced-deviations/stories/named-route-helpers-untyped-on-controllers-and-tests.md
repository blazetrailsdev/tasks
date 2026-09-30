---
title: "Named route helpers are untyped on controllers and integration tests"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8260. Rails defines one method per named route on `routes.url_helpers`: `NamedRouteCollection#add` (`action_dispatch/routing/route_set.rb:120`) calls `define_url_helper` (`route_set.rb:335`). That module is extended into controllers (`action_controller/railtie.rb:70`, `RoutesHelpers.with(app.routes)`) and included into integration tests (`action_dispatch/testing/integration.rb:367`). Every named route is therefore a callable method on a controller and on a test.

trails mixes the helpers in at run time the same way (`withRoutesHelpers`, `abstract-controller/trailties/routes-helpers.ts`; `IntegrationTest`'s constructor, `action-dispatch/testing/integration.ts`). Nothing gives them a type, though. #8260 fixed only the scaffold, by having the generator emit `declare <indexHelper>Path: (...args: unknown[]) => string;` on the controller it writes. Any other route helper a user calls fails `trails-tsc` with TS2339, for example `this.rootPath()` or a `newPostPath()` in a hand-written controller. The scaffold's functional tests call `t.postsUrl()` and `t.newPostUrl()` without error only because the generated `tsconfig.json` does not include `test/`, so they are never type-checked.

Models already have a static-typing path: `trails-tsc --schema` virtualizes model files from `db/schema.ts` (`activerecord-cli/src/tsc-wrapper/ar-models-plugin.ts`). Named routes have none.

## Acceptance criteria

- [ ] In a fresh app, the named route helpers (`*Path` / `*Url`) drawn by `config/routes.ts` type-check on every `ApplicationController` descendant and on `IntegrationTest` under `trails-tsc`, with no per-controller `declare` and no cast. That covers `resources`, `resource`, `root`, a verb with `as:`, and nesting / `namespace`.
- [ ] The helper names come from the same naming rules the `Mapper` uses at run time, not from a second hand-written implementation.
- [ ] The scaffold controller's emitted `declare <indexHelper>Path` (`scaffold-controller-generator.ts`) and its snapshot line are removed.
- [ ] The generated app's `tsconfig.json` type-checks `test/`, or the story records why it does not.
