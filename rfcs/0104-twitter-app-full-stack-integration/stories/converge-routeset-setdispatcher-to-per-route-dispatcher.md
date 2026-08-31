---
title: "converge-routeset-setdispatcher-to-per-route-dispatcher"
status: draft
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: ["port-metal-dispatch-class-method"]
deps-rfc: []
est-loc: null
priority: 41
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Routing::RouteSet` in Rails has no "set the dispatcher"
entry point: `Mapper` attaches an
`ActionDispatch::Routing::RouteSet::Dispatcher` to each route
(`action_dispatch/lib/action_dispatch/routing/mapper.rb:297`), and that
dispatcher resolves the controller per request via `req.controller_class`
(`route_set.rb:48-62` → `http/request.rb:94-110`).

trails' `RouteSet` instead exposes a single whole-set callback:

- `packages/actionpack/src/action-dispatch/routing/route-set.ts:952` —
  `setDispatcher(dispatcher: DispatcherCallback)`, documented in-file as
  "Legacy … kept for back-compat".
- `packages/actionpack/src/action-dispatch/routing/route-set.ts:858` —
  `registerController(controller, handler)` and the `DispatcherRegistry`
  already exist and are what the Rails-shaped `Dispatcher.serve`
  (`route-set.ts:157`) consults, but `RouteSet#call` — the async Rack entry
  the application endpoint uses (`trailties/src/application.ts:endpoint`) —
  never reaches them; it branches on the legacy callback instead.
- `packages/actionpack/src/action-dispatch/http/request.ts:961` —
  `controllerClassFor` throws: "Trails has no global controller constant
  table".

Consumers of the legacy seam today: `trailties/src/application/finisher.ts`
(`setup_main_autoloader`, added in PR #6517, where it carries the
`@noRailsEquivalent` tag naming this story), `website/src/lib/frontiers/app-server.ts`,
and two actionpack tests.

## Acceptance criteria

- `Request#controllerClassFor` resolves against a real controller constant
  table rather than throwing, so `Dispatcher#_controller` works per route.
- `RouteSet#call` dispatches through `Dispatcher` / `DispatcherRegistry`,
  not through a whole-set callback.
- `setDispatcher` and `DispatcherCallback` are deleted, along with the
  `@noRailsEquivalent` tag on `FinisherRoutes#setDispatcher` in
  `packages/trailties/src/application/finisher.ts`.
- The boot fixture at `packages/trailties/src/__fixtures__/boot-app/` still
  serves `posts#index` end-to-end.
