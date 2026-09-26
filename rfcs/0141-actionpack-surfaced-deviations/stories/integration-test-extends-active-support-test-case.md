---
title: "IntegrationTest < ActiveSupport::TestCase (integration.rb:651)"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::IntegrationTest < ActiveSupport::TestCase`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:651`).
In trails, `IntegrationTest`
(`packages/actionpack/src/action-dispatch/testing/integration.ts`) is a
standalone class. So:

- it inherits no `fixture_paths` class_attribute from TestFixtures, and
  `test-help.ts`'s `action_dispatch_integration_test` hook guards with
  `this.fixturePaths ?? []`, where `test_help.rb:30` does
  `self.fixture_paths += ActiveSupport::TestCase.fixture_paths`;
- nothing runs its instance `before_setup` / `after_teardown` per test.
  trails#8149 gave `ActiveSupport::TestCase` a per-test instance, but an
  integration test still calls `session.beforeSetup()` by hand.

The blocker is that `activesupport/src/test-case.ts` registers vitest hooks at
module scope, so actionpack runtime code cannot import it. The per-test
driving needs to be split from the class definition first.

## Converged shape

- `ActiveSupport::TestCase`'s class body lives in a module with no vitest
  import. The hook registration stays a test-setup file.
- `IntegrationTest extends TestCase`, and the per-test hook instantiates the
  running test's class.

## Acceptance criteria

- `IntegrationTest.prototype instanceof TestCase`.
- `test-help.ts` drops the `?? []` guard.
- `boot-app-test-help.trails.test.ts` stops calling `session.beforeSetup()` by hand.
