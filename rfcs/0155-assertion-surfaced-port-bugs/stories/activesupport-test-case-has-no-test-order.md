---
title: "activesupport-test-case-has-no-test-order"
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

`test_case_test.rb:628-658` (`TestOrderTest`) covers
`ActiveSupport::TestCase.test_order` and `ActiveSupport.test_order`
(`vendor/rails/activesupport/lib/active_support/test_case.rb:23-33`): the
default is `:random`, the two readers are the same global, and a fresh
`Class.new(ActiveSupport::TestCase)` sees it too.

trails' `TestCase` (`packages/activesupport/src/test-case.ts:48-94`) has no
`testOrder` seat at all, and `ActiveSupport` (`active-support.ts`) has no
`testOrder` either.

## Parked tests

`packages/activesupport/src/test-case.test.ts`, `it.skip` with converged bodies
and a `BLOCKED: activesupport-test-case-has-no-test-order` line:

- `defaults to random`
- `test order is global`

## Acceptance criteria

- [ ] `TestCase.testOrder` / `TestCase.setTestOrder` and the `ActiveSupport`
      twin are ported, defaulting to `":random"`.
- [ ] Both parked tests run unskipped and green with their converged bodies
      unchanged.
