---
title: "Port ActionControllerTestCaseIntegrationTest (executor around each controller test request)"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8399 ported `ActionController::Railtie`'s `action_controller.test_case` initializer
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/railtie.rb:137-141`) and covered it with two
trails-only tests in `packages/trailties/src/trailties/action-controller.trails.test.ts` that count
`to_run` hooks on a real `Application`'s executor.

Rails' own coverage is `ActionControllerTestCaseIntegrationTest`
(`vendor/rails/v8.0.2/railties/test/application/action_controller_test_case_integration_test.rb:1-109`),
which is not ported. It builds an app with a `Current < ActiveSupport::CurrentAttributes` model
whose `resets { Time.zone = "UTC" }`, a `CustomersController` with `get_current_customer` /
`set_current_customer`, and two subclasses:

- `WithExecutorIntegrationTest` (`:71-91`), `executor_around_each_request = true`:
  "current customer is cleared after each request" asserts the third request renders `noone,UTC`.
- `WithoutExecutorIntegrationTest` (`:93-108`), `executor_around_each_request = false`:
  "current customer is not cleared after each request" asserts it renders `david,Copenhagen`.

It needs the `build_app` isolation harness (`isolation/abstract_unit`) and it only passes once the
executor resets `CurrentAttributes`, which is
`active-support-railtie-reset-all-current-attributes-initializer-is-unported`.

## Acceptance criteria

- [ ] `packages/trailties/src/application/action-controller-test-case-integration.test.ts` ports both tests under their Rails names, verbatim.
- [ ] The setup mirrors `:10-65`: the `Current` model, `Customer`, `CustomersController`, the view, the route, and `config.active_support.executor_around_test_case` set from the class attribute.
- [ ] The two trails-only tests in `action-controller.trails.test.ts` are deleted once the Rails tests cover the initializer.
- [ ] `pnpm parity:test` credits both tests.
