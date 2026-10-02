---
title: "TestsWithoutAssertions warning prints line 0, and the fixtures harness still names its test case by the bare title"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["activesupport", "activerecord"]
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

The vitest runner (`packages/activesupport/src/testing/autorun.ts`) defines the running test as a
method named `test_<title>` and locates it with
`iseqLocationSetup(test, context.task.file.filepath, context.task.location?.line ?? 0)`. vitest
fills `task.location` only under `includeTaskLocation`, which `vitest.config.ts` does not enable,
so the line is always `0` and the warning reads `…/some.test.ts:0` where Rails prints the test
method's line.

The fixtures harness is a second seat for the name: `registerFixtureHooks`
(`packages/activerecord/src/test-fixtures.ts`) builds its own test case and sets
`testCase.name = ctx.task.name`, the bare vitest title, where the runner's is
`test_<title with whitespace as _>` as `Declarative#test` names it
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/declarative.rb:13`). So
`uses_transaction :test_name` only matches there when the title already is the method name.

## Acceptance criteria

- [ ] The "Test is missing assertions" warning prints the test's real line. Measure what
      `includeTaskLocation` costs across the suite before enabling it; if it is too slow, block
      with the measurement.
- [ ] The fixtures harness names its test case as the runner does.
- [ ] "without assertions" (`packages/activesupport/src/testing/test-without-assertions.test.ts`)
      and `test-fixtures.trails.test.ts` stay green.
