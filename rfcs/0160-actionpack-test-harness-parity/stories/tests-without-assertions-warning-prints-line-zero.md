---
title: "TestsWithoutAssertions warning prints line 0: the runner's test method has no first_lineno"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["activesupport"]
deps: []
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

Left over from trails PR 8411, which made `TestsWithoutAssertions#after_teardown`
(`packages/activesupport/src/testing/tests-without-assertions.ts`) read
`method(name).source_location`, as
`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/tests_without_assertions.rb:13` does.

The vitest runner (`packages/activesupport/src/testing/autorun.ts`) locates the running test with
`iseqLocationSetup(test, context.task.file.filepath, context.task.location?.line ?? 0)`. vitest
fills `task.location` only under `includeTaskLocation`, which `vitest.config.ts` does not enable,
so the line is always `0` and the warning reads `…/some.test.ts:0` where Rails prints the test
method's line.

Two smaller gaps sit beside it in the same block:

- A test whose title a `TestCase` member already answers (`"name"`, `"assertions"`, `"run"`) is not
  defined as a method, so the warning for it cannot find a location. Rails cannot collide, because
  `Declarative#test` prefixes `test_` and raises on a duplicate
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/declarative.rb:13-16`). No title
  in the repo collides today.
- `Test#name` is the vitest title, where Minitest's is the `test_…` method name.

## Acceptance criteria

- [ ] The "Test is missing assertions" warning prints the test's real line. Measure what
      `includeTaskLocation` costs across the suite before enabling it; if it is too slow, block
      with the measurement.
- [ ] A title colliding with a `TestCase` member either cannot happen (the method is named as
      `Declarative#test` names it) or raises as `declarative.rb:15` does.
- [ ] "without assertions" (`packages/activesupport/src/testing/test-without-assertions.test.ts`)
      stays green.
