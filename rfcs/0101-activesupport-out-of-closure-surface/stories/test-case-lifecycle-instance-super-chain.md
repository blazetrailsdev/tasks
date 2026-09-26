---
title: "TestCase before_setup/after_teardown as one instance super chain (setup_and_teardown.rb:39-54)"
status: draft
updated: 2026-09-26
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/test-case.ts` ports the `before_setup` /
`after_teardown` chain of `ActiveSupport::Testing::SetupAndTeardown`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/setup_and_teardown.rb:39-54`),
`TaggedLogging#before_setup` (`testing/tagged_logging.rb`),
`TimeHelpers#after_teardown` and `TestsWithoutAssertions#after_teardown` as
STATIC methods (`TestCase.beforeSetup` / `TestCase.afterTeardown`). In Rails
these are instance methods, reached through `super` from the per-test Minitest
instance.

trails#8149 added the per-test instance (`new TestCase(name)`), whose own
`beforeSetup` / `afterTeardown` come only from included modules
(`TestFixtures`). The hooks call the instance chain and then the static one, so
the two halves are ordered by hand rather than by `super`.

## Converged shape

- The modules' lifecycle methods are instance methods that call `super`, and are
  mixed into `TestCase` in Rails' include/prepend order (`test_case.rb:144-153`).
- The vitest hook calls only `testCase.beforeSetup()` / `afterTeardown()`.

## Acceptance criteria

- `TestCase.beforeSetup` / `TestCase.afterTeardown` statics are removed.
- `setup` / `teardown` callbacks and `TestFixtures` run in Rails' MRO order
  through one instance chain.
- `test-case.test.ts` and `setup-and-teardown.trails.test.ts` stay green.
