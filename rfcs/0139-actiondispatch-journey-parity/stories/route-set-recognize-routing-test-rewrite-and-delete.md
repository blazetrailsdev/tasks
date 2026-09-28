---
title: "route-set-recognize-routing-test-rewrite-and-delete"
status: done
updated: 2026-09-28
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8199
claim: "2026-09-27T23:11:18Z"
assignee: "route-set-recognize-routing-test-rewrite-and-delete"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `route-set-recognize-converges-onto-rails-seats`, split per test
file under that story's LOC clause. The first PR rewrote
`dispatch/routing-assertions.test.ts`, `dispatch/routing/route-set.test.ts`,
`routing/controller-routing.test.ts`, `routing/resource-routing.test.ts` and
`packages/website/src/lib/frontiers/sandbox-sw.ts` off `RouteSet#recognize`.

The only remaining caller is
`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`: 266
`routes.recognize(method, path)` sites plus the `routeSpec` helper at the top
of the file, which reads the invented `JourneyMatch` shape
(`match.route.defaults.*`, `match.params.*`).

Rails' seats:

- `RouteSet#recognize_path(path, environment = {})` —
  `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb:911`
  (`recognizePath`). It resolves the controller class, so every controller named
  in a drawn route must be registered in `controllerConstants` (a stub class is
  enough; see `routing/resource-routing.test.ts`'s `beforeAll`). A miss raises
  `RoutingError` where the TS asserts `toBeNull()`.
- `Journey::Router#recognize` — `journey/router.rb:68`
  (`routes.router.recognize`) for the few assertions on the matched
  `Journey::Route` itself (`route.name`, `matchedPrefix` / `postMatch` of an
  unanchored mount).
- `RouteSet#call(env)` — `route_set.rb:905`, where the Rails test in
  `vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb` does an
  integration `get`.

## Acceptance criteria

- `dispatch/routing.test.ts` has no `routes.recognize(` call and no
  `ReturnType<RouteSet["recognize"]>`. Test names are untouched.
- `RouteSet#recognize` (`routing/route-set.ts`) is deleted, and
  `routing/journey-bridge.ts` and `routing/journey-bridge.test.ts` are deleted
  with it.
- `pnpm parity:api:extra --package actiondispatch` lists no
  `routing/route-set.ts` or `routing/journey-bridge.ts` row.
