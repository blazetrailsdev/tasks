---
title: "route-set-recognize-converges-onto-rails-seats"
status: done
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8196
claim: "2026-09-27T22:42:23Z"
assignee: "route-set-recognize-converges-onto-rails-seats"
blocked-by: null
closed-reason: null
---

## Context

`RouteSet#recognize(method, path)` (`packages/actionpack/src/action-dispatch/routing/route-set.ts`,
`recognize`) has no Rails counterpart on `ActionDispatch::Routing::RouteSet`. It
delegates to `journeyRecognize` in `routing/journey-bridge.ts`, a trails-only
module (`parity:api:extra`: "1 novel, no Rails counterpart") that builds a
`Request`, runs `Journey::Router#recognize` and returns an invented
`{ route, params, matchedPrefix, postMatch }` shape (`JourneyMatch`).

Rails' seats for the same job:

- `RouteSet#recognize_path(path, environment = {})` —
  `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb:911`
  (already ported as `recognizePath`), returning the path parameters and raising
  `RoutingError` on a miss.
- `RouteSet#call(env)` — `route_set.rb:905`, dispatching through
  `@router.serve` (`journey/router.rb:33`).
- `Journey::Router#recognize(rails_req)` — `journey/router.rb:68`, already
  ported, for tests that need the matched `Journey::Route` itself.

`RouteSet#recognize` is called from ~360 test sites (mostly
`dispatch/routing.test.ts`, `routing/controller-routing.test.ts`,
`routing/resource-routing.test.ts`, `dispatch/routing/route-set.test.ts`,
`dispatch/routing-assertions.test.ts`) plus
`packages/website/src/lib/frontiers/sandbox-sw.ts`. That rewrite exceeded the
LOC ceiling of `journey-routing-parity-closing-sweep`, which removed the other
invented members (`journeyRecognize`, `getRoutes`, `getNamedRoutes`, `serve`,
`clear`) and left this one.

Rails' own tests for the same assertions use `@routes.recognize_path`,
`assert_recognizes`, or an integration `get` against the route set.

## Acceptance criteria

- `RouteSet#recognize` and `routing/journey-bridge.ts` (+ its test) are deleted.
- Each caller is rewritten onto the Rails seat its Rails test uses:
  `recognizePath` (raising `RoutingError` where the TS asserted `null`),
  `assertRecognizes`, or `routes.router.recognize` / `routes.call`.
- `sandbox-sw.ts` probes the route set through `recognizePath` (rescuing
  `RoutingError`) or `call`.
- `pnpm parity:api:extra --package actiondispatch` lists no `routing/route-set.ts`
  or `routing/journey-bridge.ts` row; test names are untouched.
- May split per test file if the rewrite exceeds the LOC ceiling.
