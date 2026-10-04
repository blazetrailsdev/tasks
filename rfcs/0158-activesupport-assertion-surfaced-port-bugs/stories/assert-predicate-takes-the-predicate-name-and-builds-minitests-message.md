---
title: "activesupport: assertPredicate takes the predicate name and builds Minitest's message"
status: draft
updated: 2026-10-04
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
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

## Acceptance criteria

- [ ] `assertPredicate` / `assertNotPredicate` accept the predicate name (the trails spelling of
      `:empty?`) and build Minitest's "Expected … to be <op>" / "to not be <op>" message.
- [ ] `assertNoErrorReported` passes the name, and
      `error-reporter-assertions.trails.test.ts` "fails when something is reported" asserts
      `/to be empty\?/` again.
