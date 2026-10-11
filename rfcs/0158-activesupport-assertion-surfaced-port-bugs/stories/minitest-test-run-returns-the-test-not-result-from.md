---
title: "Minitest::Test#run returns the test, not Result.from; sanitize_exception unported"
status: draft
updated: 2026-10-11
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8801 added `Test#run`, `#captureExceptions`, `#timeIt` and `#isPassed` to the
Minitest carrier in `packages/activesupport/src/testing/assertions.ts`, so a test can build
a test case object and run it. Against `vendor/minitest/v5.27.0/lib/minitest/test.rb`:

- `run` (`test.rb:88-106`) ends `Result.from self # per contract`; the port returns the
  test itself. `Minitest::Result` (`minitest.rb:651-690`) and `Result.from` (`:670-683`,
  copying `name`, `klass`, `assertions`, `failures`, `time`, `metadata`, `source_location`)
  are not ported.
- `capture_exceptions` (`test.rb:190-198`) wraps an unexpected error in
  `UnexpectedError.new(sanitize_exception e)`; `sanitize_exception` / `neuter_exception` /
  `new_exception` (`:200-230`) are not ported. They guard `Marshal.dump`.
- `PASSTHROUGH_EXCEPTIONS` (`test.rb:17`) lists `NoMemoryError`, which the port omits.

Callers today: `packages/activerecord/src/fixtures.test.ts` and
`packages/activerecord/src/test-fixtures.test.ts`, which read only `isPassed()`, `name` and
`failure` off the value `run` returns.

## Acceptance criteria

- [ ] `Minitest::Result` and `Result.from` ported, and `Test#run` returns `Result.from(this)`.
- [ ] `sanitize_exception` either ported, or its omission ruled on by the repo owner (JS has
      no `Marshal`).
- [ ] The two test files above still pass.
