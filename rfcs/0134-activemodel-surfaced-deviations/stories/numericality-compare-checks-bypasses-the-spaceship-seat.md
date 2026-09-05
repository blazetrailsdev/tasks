---
title: "NumericalityValidator's COMPARE_CHECKS arm compares raw operands instead of sending <=>"
status: draft
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
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

Surfaced by PR #7400, which converged `ComparisonValidator` onto the one `<=>`
seat. `NumericalityValidator` carries the same `public_send` shape and was left
alone.

`numericality.rb:58-62` dispatches the comparison off the value:

```ruby
elsif COMPARE_CHECKS.include?(option)
  option_value = option_as_number(record, option_value, precision, scale)
  unless value.public_send(COMPARE_CHECKS[option], option_value)
```

`packages/activemodel/src/validations/numericality.ts:103-113` instead calls
`compareOperator(COMPARE_CHECKS[option], num, optionValue)` with the two raw
operands. `compareOperator` (`validations/comparability.ts`) applies JS
relational operators directly, so a `bigint`/`number` pair coerces silently
where Ruby's `Integer#<=>` / `Float#<=>` would answer `nil` and
`rb_cmperr` would raise `ArgumentError: comparison of ... failed`. The
`RANGE_CHECKS` and `NUMBER_CHECKS` arms above it have the same `public_send`
shape and are inlined too (`range.isInclude`, `Math.trunc(num) % 2`).

## Converged shape

Route the `COMPARE_CHECKS` arm through the same seat `ComparisonValidator` now
uses — `rbCmpint(cmp(value, optionValue), value, optionValue)` fed to
`compareOperator` (`@blazetrails/ruby-compat`'s `comparable.ts`, the port of
`vendor/ruby/compar.c` and `rb_cmpint`) — so one `<=>` send backs both
validators and an incomparable pair raises Ruby's own `ArgumentError`.

Decide at claim time whether the `NUMBER_CHECKS` arm's `value.to_i.public_send`
converges in the same pass; `RANGE_CHECKS`' `isInclude` already IS the send.

## Acceptance criteria

- The `COMPARE_CHECKS` arm of `NumericalityValidator#validateEach` goes through
  the `<=>` seat rather than comparing raw operands.
- `packages/activemodel/src/validations/numericality-validation.test.ts` stays
  at 0 assertion-count/kind/value mismatches.
