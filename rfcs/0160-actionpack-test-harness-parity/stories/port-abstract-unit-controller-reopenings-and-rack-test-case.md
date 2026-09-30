---
title: "port-abstract-unit-controller-reopenings-and-rack-test-case"
status: claimed
updated: 2026-09-30
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-30T16:46:26Z"
assignee: "port-abstract-unit-controller-reopenings-and-rack-test-case"
blocked-by: null
closed-reason: null
---

## Context

`port-actionpack-abstract-unit-test-support` landed
`packages/actionpack/src/test-helpers/abstract-unit.ts` with
`ActionPackTestSuiteUtils`, `FIXTURE_LOAD_PATH`, `RoutedRackApp` / `Config`,
`buildApp` (the eight-middleware stack), the default `IntegrationTest.app` with
its `":controller(/:action)"` route, `DeadEndRoutes` / `NullController` /
`NullControllerRequest`, `stubControllers`, and the silenced
`DebugExceptions#stderr_logger`.

It held back the pieces of `vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb`
that no ported trails test consumes yet, so they would have landed unused:

- `SharedTestRoutes` (`:69-75`), which draws `":controller(/:action)"` under
  `ActionDispatch.deprecator.silence`
- `ActionDispatch::SharedRoutes#before_setup` (`:77-87`)
- `Rack::TestCase` (`:178-218`): `self.testing`, the Symbol-arm `get`,
  `assert_body`, `assert_status`, `assert_response`, `assert_content_type`,
  `assert_header`. It is the base of every `controller/new_base/*_test.rb`, and
  none of those files is ported
- the `ActionController::API` / `Base` / `TestCase` reopenings (`:220-244`):
  `extend AbstractController::Railties::RoutesHelpers.with(SharedTestRoutes)`
  (trails: `withRoutesHelpers` in
  `packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`),
  `include SharedTestRoutes.mounted_helpers`, `self.view_paths = FIXTURE_LOAD_PATH`,
  `Base.test_routes`, and `TestCase`'s `include TestProcess, SharedRoutes`
- `::ApplicationController < ActionController::Base` (`:246`)

`with_autoload_path` (`:161-171`) is not ported: it drives Zeitwerk, and
CLAUDE.md § "Trails has no autoloader" records that trails has none.

## Acceptance criteria

- Each piece above is in `packages/actionpack/src/test-helpers/abstract-unit.ts`
  at its Rails name, in Rails source order.
- It ships with its first consumer: at least one `controller/new_base/*_test.rb`
  port (e.g. `render_plain_test.rb`) on `Rack::TestCase`, and at least one
  `ActionController::TestCase` port that relies on `SharedRoutes`.
