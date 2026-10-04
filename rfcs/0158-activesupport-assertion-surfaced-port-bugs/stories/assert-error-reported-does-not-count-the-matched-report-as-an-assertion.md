---
title: "activesupport: assert_error_reported does not count the matched report as an assertion"
status: draft
updated: 2026-10-04
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8477, which un-hid `testing/error_reporter_assertions.rb` from `UNPORTED_FILES`.
Rails' `assert_error_reported` counts the matched report as an assertion
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/error_reporter_assertions.rb:94-96`):

```ruby
elsif (report = reports.find { |r| error_class === r.error })
  self.assertions += 1
  report
```

`assertErrorReported` (`packages/activesupport/src/testing/error-reporter-assertions.ts`) returns the
report in that arm and never touches `assertions`, so a test whose only assertion is a passing
`assert_error_reported` reads as assertion-less to `TestsWithoutAssertions`. The call gates do not see
it: `self.assertions += 1` is an attribute write, not a call the port omits.

## Acceptance criteria

- [ ] The matched arm increments the running test's `assertions` (`Test#assertions`,
      `testing/assertions.ts:67-73`) before returning the report, as `:95` does.
- [ ] A trails test covers that a passing `assertErrorReported` raises the count by one.
