---
title: "test-case-setup-callbacks-run-on-the-class-not-the-instance"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
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

Rails keeps one `:setup` / `:teardown` callback chain per test class and runs it
on the test instance: `SetupAndTeardown.prepended` calls
`define_callbacks :setup, :teardown`, `setup` / `teardown` are class methods that
`set_callback`, and `before_setup` / `after_teardown` call `run_callbacks` on
`self` (the instance)
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/setup_and_teardown.rb`).
`ActionDispatch::IntegrationTest < ActiveSupport::TestCase`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:651`)
inherits that chain.

trails has two registries after `IntegrationTest extends TestCase`:

- `packages/activesupport/src/test-case.ts` — `setupAndTeardownPrepended(TestCase)`
  defines the chains on the CLASS, `static setup = setup` registers there, and the
  static `TestCase.beforeSetup()` / `afterTeardown()` run them with `this` = the
  class, not the running instance.
- `packages/actionpack/src/action-dispatch/testing/integration.ts` —
  `SetupAndTeardown.prepended(IntegrationTest.prototype)`, a `static override setup`
  that registers on `this.prototype`, and an instance `beforeSetup` that runs the
  prototype chain on the instance.

So a `TestCase.setup` callback does not see the test instance, and an
`IntegrationTest` subclass's callbacks never reach `TestCase`'s chain (or vice
versa). `packages/activesupport/src/testing/autorun.ts` drives both: the
instance `beforeSetup` and then the static `TestCase.beforeSetup()`.

## Acceptance criteria

- One callback chain per test class, registered by `static setup` / `teardown`
  on `TestCase` and inherited by `IntegrationTest` (no `static override setup`).
- `before_setup` / `after_teardown` run it on the running instance, as
  `setup_and_teardown.rb` does; `autorun.ts` stops calling the static
  `TestCase.beforeSetup()` / `afterTeardown()`.
- A `TestCase.setup` block sees `this` as the running test instance.
