---
title: "minitest-reportable-location-and-sanitize-exception"
status: draft
updated: 2026-11-18
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

trails#10313 ported `Minitest::Result` / `Result.from` (`vendor/minitest/v5.27.0/lib/minitest.rb:651-690`) and a `Reportable` module (`passed?`, `skipped?`, `error?`) in `packages/activesupport/lib/testing/assertions.ts`. These pieces are still missing:

- `Reportable#location` and `#result_code` (`minitest.rb:613-627`). They need `Assertion#location` / `#result_code` / `#result_label` on the failure classes, which the port does not have yet.
- `Result#to_s` (`minitest.rb:685-690`).
- `Test#sanitize_exception` / `#neuter_exception` / `#new_exception` (`vendor/minitest/v5.27.0/lib/minitest/test.rb:200-230`), called by `capture_exceptions` (`:196`). They guard `Marshal.dump`, and ruby-compat's `Marshal.dump` does not serialize an Error, so a literal port would neuter every error. Needs an operator ruling, or Marshal support for exceptions.
- `NoMemoryError` in `PASSTHROUGH_EXCEPTIONS` (`test.rb:17`). ruby-compat has no such class.

## Acceptance criteria

- [ ] `location`, `result_code` and `Result#to_s` ported, along with the `Assertion` members they read.
- [ ] `sanitize_exception` is ported, or the operator rules on leaving it out.
- [ ] `PASSTHROUGH_EXCEPTIONS` matches `test.rb:17`, or the gap is ruled on.
