---
title: "ActiveRecord::TestFixtures is a class module, so before_setup cannot call super"
status: draft
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["activerecord", "trailties"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while attempting `active-support-test-case-carries-setup-and-teardown-instance-side`, whose first acceptance criterion this is.

Rails' `ActiveRecord::TestFixtures#before_setup` is `setup_fixtures; super` and `#after_teardown` is `super` with `teardown_fixtures` in `ensure` (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:9-18`). `ActiveSupport::Testing::SetupAndTeardown` is prepended onto `ActiveSupport::TestCase` (`activesupport/lib/active_support/test_case.rb:145`), so its `before_setup` (`testing/setup_and_teardown.rb:39-42`) reaches `TestFixtures#before_setup` through `super`, and that reaches `TaggedLogging#before_setup`.

trails' `TestFixtures` (`packages/activerecord/src/test-fixtures.ts:214`) is a class module. `include()` (`packages/ruby-compat/src/include.ts:916`) copies a class module's prototype members onto the includer's prototype and skips a key the includer defines itself. Two consequences:

- A class-module method cannot call `super`. Its home object is `TestFixtures.prototype`, whose parent is `Object.prototype`, so `TestFixtures#beforeSetup` (`test-fixtures.ts:261`) ends without the `super` Rails has.
- Once `ActiveSupport::TestCase.prototype` carries its own `beforeSetup` (SetupAndTeardown's), `include(TestCase, TestFixtures)` in `packages/trailties/src/test-help.ts:40` drops `TestFixtures#beforeSetup` silently. `packages/trailties/src/boot-app-test-help.trails.test.ts` reds.

A live `Module` (`packages/ruby-compat/src/include.ts:110`) is the settled shape for this: `include()` splices its carrier into the prototype chain beneath the includer's prototype (`Module#appendFeatures`), and `Module#superMethod(receiver, name)` resumes the lookup at the next link. `ActionDispatch::SharedRoutes` (`packages/actionpack/src/test-helpers/abstract-unit.ts:92-101`) already ports a `before_setup` with `super` that way.

`TestFixtures` has about thirty instance methods, an `[included]` hook that splices the `method_missing` Proxy, `declare`d fields, and is used as a type (`receiver: TestFixtures`, `new () => TestFixtures`) inside its own vitest harness (`test-fixtures.ts:568-680`), which also builds its root test case with `include(rootTestCaseClass, TestFixtures)` on a bare `class {}` that has no `beforeSetup` beneath it.

## Acceptance criteria

- `TestFixtures` is a ruby-compat `Module`, and `include(klass, TestFixtures)` splices it beneath `klass.prototype`.
- `TestFixtures#beforeSetup` is `setupFixtures` then `super`, and `#afterTeardown` is `super` with `teardownFixtures` in `finally`, both through `TestFixtures.superMethod`.
- The `[included]` hook, the `method_missing` Proxy and `TestFixtures::ClassMethods` behave as before. `test-fixtures.test.ts`, `test-fixtures.trails.test.ts`, `fixtures.test.ts` and `boot-app-test-help.trails.test.ts` stay green.
- `pnpm parity:api --package activerecord` still credits `test_fixtures.rb` at its current count.
