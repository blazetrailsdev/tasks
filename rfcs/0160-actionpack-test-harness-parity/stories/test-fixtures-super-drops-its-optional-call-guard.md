---
title: "TestFixtures#before_setup / #after_teardown call super without the optional-call guard"
status: ready
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps:
  - active-support-test-case-carries-setup-and-teardown-instance-side
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

Found while shipping `test-fixtures-is-a-live-module-so-before-setup-reaches-super` (trails PR 8355).

Rails' `ActiveRecord::TestFixtures#before_setup` is `setup_fixtures; super` and `#after_teardown` is `super` with `teardown_fixtures` in `ensure` (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:9-18`). The `super` carries no guard: `Minitest::Test` always answers both hooks, so a missing one raises `NoMethodError`.

trails' ports in `packages/activerecord/src/test-fixtures.ts` are `TestFixtures.superMethod(this, "beforeSetup")?.()` and `TestFixtures.superMethod(this, "afterTeardown")?.()`. The `?.` is a guard Rails does not have. It is there because nothing beneath the module answers the hooks yet:

- `ActiveSupport::TestCase` (`packages/activesupport/src/test-case.ts`) declares `beforeSetup?()` / `afterTeardown?()` as optional instance members and holds the real ones as statics. With an unguarded `super`, every test in `packages/trailties/src/boot-app-test-help.trails.test.ts` reds.
- The vitest harness in `test-fixtures.ts` (`testCaseClassFor`) builds its root test case on a bare `class {}`. With an unguarded `super`, `test-fixtures.test.ts` reds.
- `fixtures.test.ts`, `test-fixtures.test.ts` and `test-fixtures.trails.test.ts` include the module into bare `class {}` hosts.

`SharedRoutes#beforeSetup` (`packages/actionpack/src/test-helpers/abstract-unit.ts:101`, Rails `actionpack/test/abstract_unit.rb`) carries the same `?.()` for the same reason.

`active-support-test-case-carries-setup-and-teardown-instance-side` moves the hooks instance-side, which gives `ActiveSupport::TestCase` includers a link beneath `TestFixtures`. This story is the step after it.

## Acceptance criteria

- `TestFixtures#beforeSetup` and `#afterTeardown` call `TestFixtures.superMethod(...)!()`, with no optional call.
- `SharedRoutes#beforeSetup` drops its `?.()` likewise.
- Every includer answers both hooks beneath the module, as `Minitest::Test` does (`before_setup` / `after_teardown` are empty methods there): the `testCaseClassFor` root in `test-fixtures.ts`, and the bare `class {}` hosts in the three activerecord test files.
- `test-fixtures.test.ts`, `test-fixtures.trails.test.ts`, `fixtures.test.ts` and `boot-app-test-help.trails.test.ts` stay green.
