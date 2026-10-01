---
title: "actionpack tests cannot load Rails::Engine; EngineControllerTests are skipped"
status: claimed
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-01T16:56:27Z"
assignee: "red-fcbc702b"
blocked-by: null
closed-reason: null
---

## Context

Six actionpack test files `require "rails/engine"` and define a real
`Rails::Engine` subclass:
`vendor/rails/v8.0.2/actionpack/test/controller/test_case_test.rb:6,1149-1185`,
`test/controller/integration_test.rb`, `test/dispatch/prefix_generation_test.rb`,
`test/dispatch/routing_assertions_test.rb`, `test/dispatch/routing/inspector_test.rb`
and `test/dispatch/mount_test.rb`.

`@blazetrails/actionpack` has no dependency on `@blazetrails/trailties`
(`packages/actionpack/package.json`), and trailties depends on actionpack
(`packages/trailties/package.json:42`), so an actionpack test cannot import
`Engine`. The ported tests work around it with a stand-in:
`packages/actionpack/src/action-dispatch/dispatch/routing-assertions.test.ts:54-60`
and `dispatch/routing/inspector.test.ts:38` seat `class Engine {}` on
`TopLevel.Trails`.

`EngineControllerTests` (`test_case_test.rb:1149-1185`) cannot use a stand-in. It
needs `isolate_namespace`, `Engine.routes.draw` and the engine's route set as
`@routes`. Its two tests, `BarControllerTest#test_engine_controller_route` and
`BarControllerTestWithExplicitRouteSet#test_engine_controller_route`, are
`it.skip` in
`packages/actionpack/src/action-controller/controller/test-case.test.ts`, marked
`BLOCKED: actionpack-tests-cannot-load-rails-engine`.

Rails resolves the same cycle with a development-only dependency: railties is in
the monorepo `Gemfile`, not in `actionpack.gemspec`.

## Acceptance criteria

- actionpack's tests can import trailties' `Engine` (a dev-only dependency, with
  the subpath registrations a new cross-package import needs), without a runtime
  edge from actionpack to trailties.
- The two `EngineControllerTests` tests are ported with their Rails bodies and
  setup (`test_case_test.rb:1149-1185`).
- The `class Engine {}` stand-ins in `routing-assertions.test.ts` and
  `routing/inspector.test.ts` are replaced by the real `Engine`.
