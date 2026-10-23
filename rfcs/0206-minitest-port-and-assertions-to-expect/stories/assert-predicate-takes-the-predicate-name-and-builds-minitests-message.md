---
title: 'assertNoErrorReported fails with Minitest''s "to be empty?" message, without an assertPredicate helper'
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: close-out
packages: [activesupport]
deps: [activesupport-index-drops-minitest-assertion-exports]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8477. `assertPredicate` (`packages/activesupport/src/testing/assertions.ts:444-454`)
takes a predicate function and fails with "Expected <actual> to satisfy the predicate".
Minitest's `assert_predicate(o1, op, msg = nil)` takes the predicate's name and fails with
`"Expected #{mu_pp(o1)} to be #{op}"`, so `assert_predicate(reports, :empty?)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/error_reporter_assertions.rb:66`)
reads "Expected [...] to be empty?".

Because the port receives a function, it cannot name the predicate. `assertNoErrorReported`
(`packages/activesupport/src/testing/error-reporter-assertions.ts`) now makes Rails' two-argument
call, and its failure message lost the "to be empty?" text that a hand-built message used to carry.
`assertNotPredicate` has the same shape.

This is not a test-side helper question: CONTRIBUTING.md § "Porting a
Minitest assertion" (trails#9176) already ports a test's `assert_predicate` as
`expect(o.isFoo()).toBe(true)`. It survives only because a ported Rails body,
`assert_no_error_reported`, calls Minitest's `assert_predicate`
(`error-reporter-assertions.ts:99`). Whether that internal seat stays is the
open decision in RFC 0206 (§ "Open decision"). Rehomed from 0158 on
2026-10-23: Minitest is vendored for reference, not ported, so the
`assertPredicate` helper is deleted by
`activesupport-index-drops-minitest-assertion-exports`. What survives is the
message: Rails' `assert_no_error_reported` fails with
`"Expected [...] to be empty?"`
(`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:394-397`).

## Acceptance criteria

- [ ] `assertNoErrorReported`'s body is written in the shape Dean chose in
      RFC 0206 § "Open decision" (no `assertPredicate` helper), and on failure
      reads Minitest's `"Expected #{mu_pp(reports)} to be empty?"`, built
      from the vendored source (under option A,
      `expect(reports.isEmpty(), msg).toBe(true)` with that `msg`).
- [ ] `error-reporter-assertions.trails.test.ts` "fails when something is
      reported" asserts `/to be empty\?/` again.
