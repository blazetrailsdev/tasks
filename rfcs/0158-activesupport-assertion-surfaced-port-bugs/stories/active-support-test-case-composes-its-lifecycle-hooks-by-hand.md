---
title: "ActiveSupport::TestCase composes before_setup / after_teardown by hand instead of inheriting them"
status: ready
updated: 2026-10-02
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps:
  - prepend-copies-onto-the-class-so-super-method-cannot-resume-from-it
  - after-teardown-takes-a-test-parameter-rails-does-not-have
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

Found while shipping `active-support-test-case-carries-setup-and-teardown-instance-side` (trails PR 8362).

Rails' `ActiveSupport::TestCase` defines neither `before_setup` nor `after_teardown`. It is `class TestCase < ::Minitest::Test` and gets them from its ancestry (`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:144-152`):

- `include ActiveSupport::Testing::TaggedLogging`: `before_setup` logs the heading, then `super` (`testing/tagged_logging.rb:10-18`).
- `prepend ActiveSupport::Testing::SetupAndTeardown`: `before_setup` is `super; run_callbacks :setup`, `after_teardown` runs the teardown callbacks then `super` (`testing/setup_and_teardown.rb:39-54`).
- `prepend ActiveSupport::Testing::TestsWithoutAssertions`: `after_teardown` is `super`, then the warning (`testing/tests_without_assertions.rb:9-16`).
- `include ActiveSupport::Testing::TimeHelpers`: `after_teardown` is `travel_back; super` (`testing/time_helpers.rb:69-72`).
- `Minitest::Test`'s `LifecycleHooks` answer both hooks with empty methods (`vendor/minitest/v5.27.0/lib/minitest/test.rb:148`).

trails' `TestCase` (`packages/activesupport/src/test-case.ts:81-100`) holds two class-body methods that call the four modules' functions in sequence by hand and find the next link with `Object.getPrototypeOf(TestCase.prototype)`. TypeScript rejects `super` in a class with no `extends`, and the four modules are plain function namespaces with no `super` of their own. The methods also re-implement an `ensure` for a raising `travel_back`, which Rails gets from `ActiveRecord::TestFixtures#after_teardown`.

`after-teardown-takes-a-test-parameter-rails-does-not-have` (done, trails#8373) removed the `test` parameter and gave SetupAndTeardown and TestsWithoutAssertions their `super`. This story is the rest: TaggedLogging, TimeHelpers, the `Minitest::Test` base, and deleting the class-body hooks.

RFC 0197 is retiring ruby-compat's `Module` carrier (root CLAUDE.md § "A Ruby
module is a plain object or a class module"). A module method whose Rails body
calls `super` on a module included by an open set of classes binds it with
`rbCallSuper` at include time; `TestCase`'s prepended / included modules are
such modules. The `prepend-copies-onto-the-class-so-super-method-cannot-resume-from-it`
dependency is the old carrier's shape of that question.

## Converged shape

`TaggedLogging`, `TimeHelpers`, `SetupAndTeardown` and `TestsWithoutAssertions` are modules whose hooks call `super` at Rails' position. `TestCase` includes the first two and prepends the last two, and extends a `Minitest::Test` whose `beforeSetup` / `afterTeardown` are empty. `test-case.ts` declares neither hook.

## Acceptance criteria

- `packages/activesupport/src/test-case.ts` has no `beforeSetup` / `afterTeardown` member; both are reached through the ancestry.
- Each of the four modules' hooks calls `super` where its Rails body does.
- The observable order is unchanged: fixtures, heading, setup chain; teardown chain, `travel_back`, fixtures teardown, the no-assertions warning.
- `packages/trailties/src/boot-app-test-help.trails.test.ts`, `packages/activesupport/src/testing/*.test.ts` and the actionpack `TestCase` / `IntegrationTest` suites stay green.
- `pnpm parity:api --package activesupport` holds or raises the four files' counts; `parity:api:calls` is green.
