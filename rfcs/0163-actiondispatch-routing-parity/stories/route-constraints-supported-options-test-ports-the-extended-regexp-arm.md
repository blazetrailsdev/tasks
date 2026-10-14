---
title: "RouteSetTest's supported-options test ports its second assert_nothing_raised arm"
status: in-progress
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: trails#8896
claim: "2026-10-14T12:12:40Z"
assignee: "fixtures-nested-describe-inherits-regardless-of-call-order"
blocked-by: null
closed-reason: null
---

## Context

`RouteSetTest#test_route_constraints_with_supported_options_must_not_error`
(`vendor/rails/v8.0.2/actionpack/test/controller/routing_test.rb:1672-1691`)
has two `assert_nothing_raised` blocks: one draws a route constrained by
`/(david|jamis)/i`, the other by the same alternation written with the `x`
flag. The port in
`packages/actionpack/src/action-controller/controller/routing.test.ts`
carries only the first, so `pnpm parity:test --assertions` reports
`nothingRaised rails 2 vs trails 1` for the test.

JS has no `x` flag. The sibling ports `route requirement recognize with
extended syntax` and `route requirement with xi modifiers` write the pattern
without its whitespace and comments (`/(david|jamis)/`), and the second arm
here takes the same shape.

## Acceptance criteria

- [ ] The test carries both `assert_nothing_raised` arms, in Rails order.
- [ ] `pnpm parity:test --assertions` no longer lists the test, and the
      actioncontroller assertion-count mark is tightened.
