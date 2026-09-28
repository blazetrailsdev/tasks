---
title: "Port the core of actionpack's test/abstract_unit.rb as the shared test harness"
status: done
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8210
claim: "2026-09-28T02:14:25Z"
assignee: "integration-session-delegated-readers-and-host-bang"
blocked-by: null
closed-reason: null
---

## Context

Every actionpack test file opens with `require "abstract_unit"`
(`vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb`, 534 lines). trails has
no port of it, so each test file builds its own app: `buildApp` in
`packages/actionpack/src/action-dispatch/dispatch/ssl.test.ts:8`, and again in
`show-exceptions.test.ts`, `host-authorization.test.ts`,
`content-security-policy.test.ts`, `action-controller/controller/integration.test.ts`
and `action-dispatch/testing/integration.test.ts`.

The Rails pieces, in source order:

- `ActionPackTestSuiteUtils` (`abstract_unit.rb:45-65`)
- `FIXTURE_LOAD_PATH` (`:67`) — the fixtures themselves are
  `port-actionpack-view-and-helper-test-fixtures`
- `ActionDispatch::SharedRoutes` (`:77-87`), which draws `":controller(/:action)"`
- `RoutedRackApp` and its `Config` struct (`:97-116`)
- `ActionDispatch::IntegrationTest.build_app` with the default middleware stack
  (ShowExceptions over `fixtures/public`, DebugExceptions, ActionableExceptions,
  Callbacks, Cookies, Flash, `Rack::MethodOverride`, `Rack::Head`), `test_routes`
  and `DeadEndRoutes` (`:118-176`)
- `Rack::TestCase` (`:178-218`) — the base of every `controller/new_base/*_test.rb`
- the `ActionController::API` / `Base` / `TestCase` reopenings (`:220-244`) and
  `::ApplicationController` (`:246`)
- the silenced `DebugExceptions#stderr_logger` (`:249-258`)

The rest of the file is split off so this PR stays reviewable:
`RoutingVerbs`, `RoutingTestHelpers` / `TestSet`, the `ResourcesController`
family, `CookieAssertions` and `HeadersAssertions` (`:260-516`) are
`port-abstract-unit-routing-and-assertion-helpers`; the `DrivenBy*`
system-test classes (`:518-533`) belong to RFC 0166.

## Acceptance criteria

- A module under `packages/actionpack/src/test-helpers/` (activerecord's layout,
  `packages/activerecord/src/test-helpers/`) exports each piece above at its
  Rails name, in Rails source order, with Rails' method and local names.
- `buildApp`'s default stack is Rails' eight middleware in Rails' order.
- `pnpm parity:api:extra --package actiondispatch` and `--package actioncontroller`
  report no new name: the directory is outside the compared population, as
  activerecord's is. If it is not, stop and say so in the PR — do not receipt
  test support.
- At least one existing test per helper imports it, so none of it lands unused.

## Definition of done

Converging the existing hand-rolled `buildApp`s is
`converge-hand-rolled-build-app-onto-abstract-unit`, not this story.
