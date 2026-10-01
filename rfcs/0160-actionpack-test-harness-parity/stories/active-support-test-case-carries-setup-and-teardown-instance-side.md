---
title: "active-support-test-case-carries-setup-and-teardown-instance-side"
status: ready
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps:
  - test-fixtures-is-a-live-module-so-before-setup-reaches-super
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

Rails' `ActiveSupport::TestCase` does `prepend ActiveSupport::Testing::SetupAndTeardown`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:145`). That module's
`before_setup` is `super; run_callbacks :setup` and its `after_teardown` runs the teardown
callbacks and then calls `super` (`testing/setup_and_teardown.rb:39-54`). Every subclass
inherits them: `ActionController::TestCase` (`actionpack/lib/action_controller/test_case.rb:368`)
and `ActionDispatch::IntegrationTest`, whose `Runner#before_setup` is only `@app = nil; super`
(`action_dispatch/testing/integration.rb:347-350`).

trails#8295 made trails' `ActionController::TestCase` extend trails' `ActiveSupport::TestCase`.
The SetupAndTeardown instance methods still can't live on `ActiveSupport::TestCase`, though.
`include()` copies a class module onto the prototype and skips an own member, so an own
`beforeSetup` on `ActiveSupport::TestCase.prototype` silently drops the `TestFixtures#beforeSetup`
that trailties' `test_help` includes (`packages/trailties/src/test-help.ts:29`). trails'
`TestFixtures#beforeSetup` (`packages/activerecord/src/test-fixtures.ts:237`) also does not
call `super`, where Rails' does (`setup_fixtures; super`). Trying it reds
`packages/trailties/src/boot-app-test-help.trails.test.ts`.

So the lifecycle is duplicated in two subclass bodies:

- `ActionController::TestCase#beforeSetup` / `#afterTeardown`
  (`packages/actionpack/src/action-controller/test-case.ts`)
- `IntegrationTest#beforeSetup` / `#afterTeardown`
  (`packages/actionpack/src/action-dispatch/testing/integration.ts`)

trails' `ActiveSupport::TestCase` also stores its setup/teardown chains on the class function
and runs them statically from `activesupport/src/testing/autorun.ts`. Both subclasses store
theirs on the prototype instead.

`ActionController::TestCase::Behavior` (`test_case.rb:370-694`, `include Behavior` at `:696`)
is also unported: its methods sit in the TestCase class body. Extracting it moves the whole class
body, so it is its own story: `action-controller-test-case-behavior-module-is-unported`.

## Acceptance criteria

- `TestFixtures#beforeSetup` / `#afterTeardown` call `super` as Rails' do, and are reached
  through the ancestry rather than copied over an own member.
- trails' `ActiveSupport::TestCase` carries SetupAndTeardown's instance `beforeSetup` /
  `afterTeardown`, and each test class's setup/teardown chain is run per instance.
- The class-body `beforeSetup` / `afterTeardown` in `action-controller/test-case.ts` are deleted.
  `IntegrationTest#beforeSetup` becomes `Runner#before_setup` (`@app = nil; super`) and its
  `afterTeardown` is deleted.
- `include(ActionController::TestCase, ActionDispatch::SharedRoutes)`
  (`packages/actionpack/src/test-helpers/abstract-unit.ts`) still runs before the inherited
  `beforeSetup`, and every actionpack, activesupport and trailties test file stays green.
