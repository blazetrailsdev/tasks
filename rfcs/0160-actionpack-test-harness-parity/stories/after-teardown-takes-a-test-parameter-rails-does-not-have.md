---
title: "SetupAndTeardown / TestsWithoutAssertions after_teardown take a test parameter Rails does not have and drop super"
status: ready
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
deps:
  - active-support-test-case-carries-setup-and-teardown-instance-side
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while shipping `test-fixtures-is-a-live-module-so-before-setup-reaches-super` (trails PR 8355).

Rails' `after_teardown` takes no parameter anywhere in the chain, and every link calls `super`:

- `ActiveSupport::Testing::SetupAndTeardown#after_teardown` (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/setup_and_teardown.rb:44-54`) runs the teardown callbacks, pushes onto `self.failures`, then calls `super`.
- `ActiveSupport::Testing::TestsWithoutAssertions#after_teardown` (`testing/tests_without_assertions.rb:9-16`) calls `super`, then reads `assertions`, `skipped?`, `error?` and `name` off `self`.
- `ActiveRecord::TestFixtures#after_teardown` (`activerecord/lib/active_record/test_fixtures.rb:14-18`) is `super` with `teardown_fixtures` in `ensure`.

trails' ports take a `test` parameter Rails does not have, and neither calls `super`:

- `afterTeardown(this: object, test: Pick<RunningTest, "failures">)` in `packages/activesupport/src/testing/setup-and-teardown.ts`.
- `afterTeardown(test: RunningTest)` in `packages/activesupport/src/testing/tests-without-assertions.ts`. `RunningTest` is an invented interface carrying a `@noRailsEquivalent PERMANENT` receipt.
- `ActiveSupport::TestCase.afterTeardown(test)` (`packages/activesupport/src/test-case.ts`) calls the three in sequence by hand, and `testing/autorun.ts` passes `test` to `testCase.afterTeardown?.(test)`.

`TestFixtures#afterTeardown` (`packages/activerecord/src/test-fixtures.ts`) is now faithful: zero parameters, and its `super` forwards none. Once `active-support-test-case-carries-setup-and-teardown-instance-side` puts the ActiveSupport hooks in the ancestry, `TestFixtures` sits between `SetupAndTeardown` (prepended) and `TestsWithoutAssertions`, so a `test` argument handed in at the top is dropped at `TestFixtures` and `TestsWithoutAssertions#afterTeardown` receives `undefined`.

## Acceptance criteria

- `SetupAndTeardown#afterTeardown` and `TestsWithoutAssertions#afterTeardown` take no parameter and read `failures`, `assertions`, `isSkipped`, `isError` and `name` off `this`, as the Rails bodies do.
- Both call `super` at the position Rails does (`setup_and_teardown.rb:53`, `tests_without_assertions.rb:10`).
- `RunningTest` is deleted, or reduced to whatever the vitest runner needs outside the ported bodies.
- `testing/autorun.ts` calls `afterTeardown()` with no argument.
- `pnpm parity:api:params` and `pnpm parity:api:calls` stay green for activesupport.
