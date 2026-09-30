---
title: "port-abstract-unit-shared-routes-and-controller-reopenings"
status: draft
updated: 2026-09-30
rfc: "0160-actionpack-test-harness-parity"
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

`port-abstract-unit-controller-reopenings-and-rack-test-case` landed `Rack::TestCase`
(`vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb:178-218`) and `::ApplicationController`
(`:246`) in `packages/actionpack/src/test-helpers/abstract-unit.ts`, with
`controller/new_base/render_plain_test.rb` as its consumer
(`packages/actionpack/src/action-controller/controller/new-base/render-plain.test.ts`).

It held back the pieces that need an `ActionController::TestCase` consumer and that
reach every file importing abstract-unit:

- `ActionDispatch::SharedRoutes#before_setup` (`abstract_unit.rb:77-87`): builds a fresh
  `RouteSet`, draws `":controller(/:action)"` under `ActionDispatch.deprecator.silence`,
  then `super`.
- The `ActionController::API` / `Base` / `TestCase` reopenings (`:220-244`):
  `extend AbstractController::Railties::RoutesHelpers.with(SharedTestRoutes)` on both API
  and Base (trails: `withRoutesHelpers` in
  `packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`, which splices a
  Proxy above the class prototype), `include SharedTestRoutes.mounted_helpers`,
  `self.view_paths = FIXTURE_LOAD_PATH` (trails spelling `Base.viewPaths(FIXTURE_LOAD_PATH)`),
  `Base.test_routes`, and TestCase's `include ActionDispatch::TestProcess, SharedRoutes`.

Blocker to watch: trails' `ActionController::TestCase` (`packages/actionpack/src/action-controller/test-case.ts`)
defines `beforeSetup` in its own class body, so a plain `include(TestCase, SharedRoutes)`
is outranked by it. Rails' TestCase class defines no `before_setup` (it comes from
`Behavior`), so `SharedRoutes` sits above it. Converge with a live `Module` from
ruby-compat whose `beforeSetup` calls `SharedRoutes.superMethod(this, "beforeSetup")`,
and move TestCase's own `beforeSetup` onto its Behavior module if needed.

## Acceptance criteria

- `SharedRoutes`, the API/Base/TestCase reopenings and `Base.testRoutes` are in
  `abstract-unit.ts` at their Rails names, in Rails source order.
- They ship with at least one `ActionController::TestCase` port that relies on
  `SharedRoutes` (its `@routes`), e.g. a test in `controller/test_case_test.rb` or
  `controller/url_for_test.rb` that is currently skipped for want of routes.
- Every existing test file importing `test-helpers/abstract-unit.js` stays green
  (Base's global view paths and routes-helpers Proxy reach all of them).
