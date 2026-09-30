---
title: "action-controller-test-case-inherits-active-support-test-case"
status: closed
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
closed-reason: "superseded by active-support-test-case-carries-setup-and-teardown-instance-side; the superclass half shipped in trails#8295"
---

## Context

Rails' `ActionController::TestCase < ActiveSupport::TestCase`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:368`), and
`before_setup` / `after_teardown` reach it from `ActiveSupport::TestCase`'s
`prepend ActiveSupport::Testing::SetupAndTeardown`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:145`,
`testing/setup_and_teardown.rb:39-54`). Rails' TestCase class body defines
neither method, and it `include Behavior` (`test_case.rb:696`).

trails' `ActionController::TestCase` (`packages/actionpack/src/action-controller/test-case.ts`)
has no superclass. trails#8295 needed `include ActionDispatch::SharedRoutes`
(`actionpack/test/abstract_unit.rb:242`) to outrank the lifecycle methods, so it
moved them off the class body onto an anonymous live `Module` included into
TestCase before any other module. That module is a placeholder for the missing
superclass.

Meanwhile `IntegrationTest extends ActiveSupport TestCase`
(`packages/actionpack/src/action-dispatch/testing/integration.ts:63`) and runs
`SetupAndTeardown.beforeSetup` from its own class-body `beforeSetup`, because
trails' `ActiveSupport::TestCase` (`packages/activesupport/src/test-case.ts`) has
no instance-side prepended SetupAndTeardown.

The blockers to converging it:

- `ActionController::TestCase` takes `new TestCase(controllerClass)` (28 call
  sites), where Rails/minitest is `new(name)`.
- `activesupport/src/testing/autorun.ts` instantiates any `ActiveSupport::TestCase`
  subclass found by a suite name with `new klass(taskName)`.

## Acceptance criteria

- trails' `ActiveSupport::TestCase` carries the instance-side prepended
  `SetupAndTeardown` (`before_setup` / `after_teardown`), and
  `IntegrationTest` stops re-running it in its own body.
- `ActionController::TestCase extends` trails' `ActiveSupport::TestCase`, and
  defines `Behavior` included at `test_case.rb:696`.
- The anonymous lifecycle `Module` in `action-controller/test-case.ts` is deleted.
  `include(TestCase, SharedRoutes)` in `test-helpers/abstract-unit.ts` still
  outranks the inherited `beforeSetup`.
- Every `ActionController::TestCase` / `IntegrationTest` test file stays green.
