---
title: "activesupport: TestCase includes ErrorReporterAssertions; assertErrorReported is not a moved static"
status: done
updated: 2026-10-04
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8477
claim: "2026-10-04T12:06:50Z"
assignee: "string-types-changed-in-place-and-cast-value-carry-invented-arms"
blocked-by: null
closed-reason: null
---

## Context

Observed while working trails#8463. `pnpm parity:api:extra --package activesupport`
reports

    test-case.ts — 0 novel, 2 moved
      assertErrorReported      assertNoErrorReported

`packages/activesupport/src/test-case.ts` hand-assigns them
(`static assertErrorReported = assertErrorReported; static assertNoErrorReported = assertNoErrorReported`)
from `testing/error-reporter-assertions.ts`. Rails reaches them through
`include ActiveSupport::Testing::ErrorReporterAssertions`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:148`), and
the methods are defined in
`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/error_reporter_assertions.rb`.

The extractor does record that include on `ActiveSupport::TestCase`, yet the two
names still score as moved while the sibling hand-assigned assertion statics
(`assertNot`, `assertDeprecated`, `travel`, ...) do not. The cause was not
investigated: either the module's source is treated as unported, or the walk
does not reach these two methods.

The whole block of `static x = x` assignments in `test-case.ts` is the
hand-assign shape CLAUDE.md § "Module mixins" says to replace with
`include()` / `extend()`.

## Acceptance criteria

- [ ] The cause of the two moved names is identified and stated in the PR.
- [ ] `TestCase` gains `assert_error_reported` / `assert_no_error_reported` through `include(TestCase, ErrorReporterAssertions)`, as `test_case.rb:148` does, not a hand-assigned static.
- [ ] `parity:api:extra --package activesupport` lists no moved names on `test-case.ts`.
