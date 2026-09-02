---
title: "Delete DispatcherRegistry so Dispatcher#controller is req.controller_class alone"
status: claimed
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: "2026-09-01T23:54:13Z"
assignee: "collapse-dispatcher-registry-into-the-constant-table"
blocked-by: null
closed-reason: null
---

## Context

Ruby has one global constant namespace, so
`ActionDispatch::Request#controller_class_for` has exactly one place to look
(`vendor/rails/actionpack/lib/action_dispatch/http/request.rb:94-110`):

```ruby
const_name = controller_param.camelize << "Controller"
const_name.constantize
```

and `RouteSet::Dispatcher#controller` is one line —
`req.controller_class` (`routing/route_set.rb:60-63`).

trails now has **three** lookup paths where Rails has one:

1. `controllerConstants` — the process-wide map PR #7286 added in
   `packages/actionpack/src/action-dispatch/http/request.ts`, seeded by
   railties' `setup_main_autoloader`.
2. `DispatcherRegistry` — a RouteSet-scoped overlay
   (`packages/actionpack/src/action-dispatch/routing/dispatcher.ts`, a file
   with no Rails counterpart) that `Dispatcher#_controller`
   (`routing/route-set.ts`) consults **before** `req.controllerClass()`.
3. `ActiveSupport::Inflector`'s real constant table
   (`packages/activesupport/src/inflector.ts`, landed by PR #5471) — the one
   `constantize` actually reads, which controllers still never register into.
   That gap is story
   `controller-constant-resolution-throws-instead-of-constantize`.

The registry exists because PR #7286's own acceptance criteria named it
("`RouteSet#call` dispatches through `Dispatcher` / `DispatcherRegistry`"), and
because a per-RouteSet map avoids cross-test pollution of a global one. Neither
is a Rails shape: Rails' tests define real global constants and live with it,
which is precisely why `controller_class_for` needs no overlay and
`Dispatcher#controller` needs no pre-check.

The cost is a branch in `_controller` that `route_set.rb:60-63` does not have,
and a second registration API (`RouteSet#registerController`) with no Ruby
counterpart.

## Converged shape

- `Dispatcher#_controller` becomes `req.controllerClass()` alone, with only the
  `NameError` → `ActionController::RoutingError` rescue Rails has
  (`route_set.rb:60-63`). The `this._registry?.resolve(...)` pre-check and the
  `_registry` field go.
- `DispatcherRegistry`, `RouteSet#registerController` and
  `RouteSet#dispatcherRegistry` are deleted;
  `packages/actionpack/src/action-dispatch/routing/dispatcher.ts` keeps only
  `DispatchableControllerClass`, or folds that into `route-set.ts` too.
- `StaticDispatcher` is unaffected — binding a controller class at construction
  IS Rails (`route_set.rb:71-79`).
- Callers that register per-RouteSet move to the constant table: the tests in
  `routing/dispatcher.test.ts`, `dispatch/routing.test.ts`,
  `routing/controller-routing.test.ts`,
  `action-controller/controller/json-rendering.test.ts`, and
  `packages/website/src/lib/frontiers/app-server.ts`. They need a
  register/unregister discipline around each test (PR #7286's
  `beforeEach`/`afterEach` on `controllerConstants` in `dispatcher.test.ts` is
  the pattern).
- Ideally land **after** or **with**
  `controller-constant-resolution-throws-instead-of-constantize`, so the one
  surviving table is the Inflector's and `controllerClassFor` genuinely
  `constantize`s — otherwise this trades three tables for two.

## Notes

PR #7286 tagged `controllerConstants` `@noRailsEquivalent PERMANENT` on the
grounds that ESM has no `const_missing`. That reason holds for _eager
population_, but not for _a separate table_: activesupport already has the
constant table `constantize` reads. When this story or
`controller-constant-resolution-throws-instead-of-constantize` lands, that
receipt should become `CONVERGEABLE <story-id>` — or disappear with the map.
