---
title: "test_help's before_setup reopenings are modules beneath the class, so Runner#before_setup runs first"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while shipping trails PR 8373.

Rails' `test_help` defines `before_setup` on the two test classes themselves (`vendor/rails/v8.0.2/railties/lib/rails/test_help.rb:35-47`): the `on_load` block is class-evaluated, so `def before_setup; @routes = Rails.application.routes; super; end` is the class's own method and outranks every included module.

trails' `packages/trailties/src/test-help.ts` ports each reopening as a `Module` included at the load hook. The module's link sits BENEATH the class, so a class-body `beforeSetup` outranks it. `IntegrationTest` has one (`packages/actionpack/src/action-dispatch/testing/integration.ts`, `beforeSetup`: `this._app = undefined; return super.beforeSetup()`), which is `ActionDispatch::Integration::Runner#before_setup` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:347-350`) written into the class body. So on `IntegrationTest` trails runs Runner's `@app = nil` and then the routes assignment, where Rails runs the routes assignment first.

The module form was forced: assigning `IntegrationTest.prototype.beforeSetup` would replace the class-body method and lose `@app = nil`. In Rails, Runner is an included module, so the reopening replaces nothing.

## Converged shape

Once `Runner` is a module included into `IntegrationTest` (`port-integration-runner-module-and-runner-tests`, `integration-runner-merged-into-session`), each reopening defines `beforeSetup` on the class's own prototype and reaches the next method at call time, with no intermediate `Module`.

## Acceptance criteria

- `test-help.ts` defines `beforeSetup` on `ActionController::TestCase` and `ActionDispatch::IntegrationTest` themselves; `super` resolves at call time.
- On `IntegrationTest` the routes assignment runs before `Runner#before_setup`, as `test_help.rb:42-47` over `integration.rb:347-350`.
- "reaches a module included onto ActionController::TestCase after test_help loads" and the rest of `packages/trailties/src/boot-app-test-help.trails.test.ts` stay green.
