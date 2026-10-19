---
title: "inspector 'routes when expanded' runs the Rails body with Source Location rows"
status: ready
updated: 2026-10-19
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

Rails `test_routes_when_expanded` (`vendor/rails/v8.0.2/actionpack/test/dispatch/routing/inspector_test.rb:319-368`) sets `Mapper.route_source_locations = true` and asserts a `Source Location   | file:line` row for each route, including the engine's routes.

trails#8907 ported `Mapping#routeSourceLocation` (`mapper.rb:378-389`). The port of this test is still `it.skip("routes when expanded")` at `packages/actionpack/src/action-dispatch/dispatch/routing/inspector.test.ts:208`. That test file lives under `src/action-dispatch/`, which is the directory `routeSourceLocation` skips as framework code, so every frame from the test body is skipped. In Rails the test is outside `lib/action_dispatch`. The behaviour is covered for now by `packages/actionpack/src/routing-source-location.trails.test.ts`.

## Acceptance criteria

- `routes when expanded` runs with the Rails body and expected rows, including the line offsets (`lineno + 2/6/7/8`).
- Get the test frames out of the skipped directory. Options: move the actionpack test tree out of `src/action-dispatch/`, or compute the skip directory so it covers only non-test sources, as `__dir__` does for `lib/`. No invented arm in `routeSourceLocation`.
- Delete `routing-source-location.trails.test.ts` once the Rails test covers it.
