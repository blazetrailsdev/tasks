---
title: "activesupport-test-case-does-not-tag-the-logger-with-the-running-test"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
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

`test_case_test.rb:616-626` (`TestCaseTaggedLoggingTest`) asserts the tagged
logger has already received `"#{self.class}: #{name}\n"` by the time the test
body runs — Rails' `ActiveSupport::Testing::TaggedLogging#before_setup`
(`vendor/rails/activesupport/lib/active_support/testing/tagged_logging.rb:16-24`)
writes the heading.

trails' `beforeSetup`
(`packages/activesupport/src/testing/tagged-logging.ts:16-24`) writes it only
when `logger["info?"]` is truthy, and a plain `Logger`
(`packages/activesupport/src/logger.ts`) exposes no such reader, so nothing is
written.

## Parked test

`packages/activesupport/src/test-case.test.ts` › `TestCaseTaggedLoggingTest` ›
`logs tagged with current test case`, `it.skip` with the converged body and a
`BLOCKED: activesupport-test-case-does-not-tag-the-logger-with-the-running-test`
line.

## Acceptance criteria

- [ ] `Logger` answers the `info?` / `warn?` predicates
      `tagged-logging.ts` and `_assertNothingRaisedOrWarn` read.
- [ ] The parked test runs unskipped and green with its converged body
      unchanged.
