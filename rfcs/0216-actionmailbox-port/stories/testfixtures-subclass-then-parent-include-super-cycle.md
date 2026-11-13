---
title: "testfixtures-subclass-then-parent-include-super-cycle"
status: draft
updated: 2026-11-13
rfc: "0216-actionmailbox-port"
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

Supersedes the diagnosis in `test-help-double-include-testfixtures-recursion`; its premise ("include of an already-included module") is not what happens.

Reproduced by adding `import "@blazetrails/trailties/test-help"` to `packages/actionmailbox/src/test-helpers/test-helper.ts` (plus a `@blazetrails/trailties/test-help` alias in `vitest.config.ts`) and running `packages/actionmailbox/src/unit/dummy-app.trails.test.ts` in the `activerecord` project: the heap fills up.

Mechanism (instrumented):

1. `packages/activerecord/test/cases/test-case.ts:84` includes `TestFixtures` into `ActiveRecord::TestCase` (subclass). `rbSeatSuper` (`packages/ruby-compat/lib/object.ts`) snapshots `ActiveRecord::TestCase.prototype[super:TF#beforeSetup] = SetupAndTeardown#beforeSetup`, which is prepended onto `ActiveSupport::TestCase` (`packages/activesupport/lib/test-case.ts:102-107`).
2. test-help's `on_load(:active_support_test_case)` (`vendor/rails/v8.0.2/railties/lib/rails/test_help.rb:20-30`, `packages/trailties/lib/test-help.ts`) includes `TestFixtures` into the PARENT `ActiveSupport::TestCase`. `isModuleIncluded` is correctly false there. The `prependOrigin` branch of `rbModAppendFeatures` (`packages/ruby-compat/lib/include.ts`) seats `AS::TestCase.prototype[super:SAT#beforeSetup] = TF#beforeSetup`.
3. On an AR test instance, TF → (AR seat) SAT → (AS seat) TF → `this[super:TF]` resolves to the AR seat again → SAT → … Each step awaits `setupFixtures`, so it fills the heap instead of overflowing the stack.

In Ruby both copies of TestFixtures sit in the ancestry (`include_modules_at`, `vendor/ruby/v3.3.11/class.c:1253`, checks only the includer's own superclass chain), so `setup_fixtures` would run twice. trails' super seat is a single snapshot slot per function, and it cannot hold one function at two ancestry positions.

Tried and rejected: skipping the member in the `prependOrigin` branch when the module's seat already holds the prepended method. That stops the OOM, but `ActiveSupport::TestCase` direct subclasses (`ActiveJob::TestCase` users in actionmailbox) then get TF's `afterTeardown` without its `beforeSetup`. Ten actionmailbox tests fail in `settlePendingPins` (`packages/activerecord/lib/test-fixtures.ts:519`).

Options: (a) make `rbCallSuper` resolve per-copy seats when a function is seated on two prototypes (fast-path flag); (b) stop the actionmailbox tests in the `activerecord` vitest project defaulting to `ActiveRecord::TestCase` (`packages/activerecord/test/cases/helper.ts:45`, `registerSpecType(/(?:)/, rootTestCase())`), so test-help's include is the only one, as in Rails' own actionmailbox suite.

## Acceptance criteria

- actionmailbox's `test-helpers/test-helper.ts` imports `@blazetrails/trailties/test-help`, as Rails' `test_helper.rb` requires `rails/test_help`, and the actionmailbox suite passes.
- No `rbCallSuper` cycle when a module is included into a subclass and then into its parent below a prepend; a ruby-compat regression test covers that order.
