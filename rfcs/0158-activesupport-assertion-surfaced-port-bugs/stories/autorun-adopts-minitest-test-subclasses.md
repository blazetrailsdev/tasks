---
title: "autorun-adopts-minitest-test-subclasses"
status: closed
updated: 2026-10-21
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "avoiding minitest in favor of native vitest"
---

## Context

Minitest's autorun runs every `Minitest::Test` subclass
(`vendor/minitest/v5.27.0/lib/minitest.rb`, `Runnable.runnables`). trails'
`autorun` (`packages/activesupport/src/testing/autorun.ts`, `describe()`)
adopts a described constant only when
`constant.prototype instanceof TestCase` (ActiveSupport's). Otherwise it builds
a fresh `ActiveSupport::TestCase` subclass, so a test class deriving from
`Minitest::Test` directly loses its own instance methods.

marcel's `Marcel::TestCase < Minitest::Test` (`test/test_helper.rb`) defines
`files` and `fixture_path`. In the Ruby-to-TS generator's marcel trial, its
tests fail with `testCase.files is not a function`. trails' `Minitest.Test`
(`testing/assertions.ts`) already has the `beforeSetup` / `afterTeardown`
hooks `autorun` calls.

## Acceptance criteria

- `describe()` adopts any registered constant whose prototype is a
  `Minitest.Test`, as Minitest's runner does.
- A test whose class derives from `Minitest.Test` directly gets an instance of
  that class as `testCase`. The test fails before the change.
- Existing `ActiveSupport::TestCase` suites are unaffected.
