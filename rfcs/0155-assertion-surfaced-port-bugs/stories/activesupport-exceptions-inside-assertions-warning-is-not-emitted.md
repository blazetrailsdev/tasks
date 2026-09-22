---
title: "activesupport-exceptions-inside-assertions-warning-is-not-emitted"
status: ready
updated: 2026-09-22
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

RFC 0132 converged `test_case_test.rb`'s `ExceptionsInsideAssertionsTest`
(`vendor/rails/activesupport/test/test_case_test.rb:484-556`). Two of its four
tests converge green; two do not.

`test_warning_is_not_logged_if_assertions_are_nested_correctly`
(`:505-511`) asserts that the failure message reports a change in `rand`.
Rails' bare `rand` is an expression whose source text is just `rand`; the trails
expression is a thunk, and `_callableToSourceString`
(`packages/activesupport/src/testing/assertions.ts:322-336`) renders
`() => rand()` as `rand()`, so the rendered name carries the call parentheses
and the assertion misses.

`test_fails_and_warning_is_logged_if_wrong_error_caught` (`:513-525`) asserts
the failure carries `"ArgumentError: ArgumentError"` and the raising method
name. trails' `assertRaises` (`assertions.ts:119-136`) fails with
`ArgumentError expected, not UnexpectedError` and carries neither.

## Parked tests

`packages/activesupport/src/test-case.test.ts`, `it.skip` with converged bodies
and a `BLOCKED: activesupport-exceptions-inside-assertions-warning-is-not-emitted`
line:

- `warning is not logged if assertions are nested correctly`
- `fails and warning is logged if wrong error caught`

## Acceptance criteria

- [ ] `assertRaises`'s mismatch failure names the raised class and the raising
      frame the way Minitest's does.
- [ ] Both parked tests run unskipped and green with their converged bodies
      unchanged.
