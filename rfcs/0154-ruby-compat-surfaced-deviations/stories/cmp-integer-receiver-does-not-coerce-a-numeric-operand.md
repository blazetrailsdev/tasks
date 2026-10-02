---
title: "ruby-compat: cmp answers nil for an Integer or Float against a BigDecimal or Rational, where rb_num_coerce_cmp coerces"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Integer#<=>` and `Float#<=>` coerce a Numeric operand of another class before
giving up: `fix_cmp` (`vendor/ruby/v3.3.11/numeric.c:4646`) and `rb_int_cmp`
(`:4696`) end in `rb_num_coerce_cmp` (`:484`), which sends `coerce` to the
operand. So `1 <=> BigDecimal("0.5")` is `1`, and `1 > BigDecimal("0.5")` is
`true` (`rb_int_gt`, `:4743`, through `rb_num_coerce_relop`, `:499`).

ruby-compat's `cmp` (`packages/ruby-compat/src/comparable.ts`) answers `nil`
for a `number` / `bigint` receiver whose operand is not itself a `number` or
`bigint` (its `typeof a === "number" || typeof a === "bigint"` arm returns
`null` once the `isInfinite` probe misses). Measured on the built packages
after trails PR 8409:

- `cmp(1, new BigDecimal("0.5"))` is `null`; `cmp(new BigDecimal("0.5"), 1)` is `-1`.
- `rbFPublicSend(1, ">", new BigDecimal("0.5"))` raises
  `ArgumentError: comparison of Integer with BigDecimal failed`.

`NumericalityValidator#validate_each` and `ComparisonValidator#validate_each`
send that operator (`activemodel/lib/active_model/validations/numericality.rb:60`,
`comparison.rb:27`), so an Integer value against a BigDecimal or Rational
option raises where Rails compares.

## Acceptance criteria

- [ ] `cmp` with a `number` / `bigint` receiver and a Numeric operand of another class (BigDecimal, Rational) coerces as `rb_num_coerce_cmp` does and answers the ordering, with `nil` only for an operand that cannot be coerced.
- [ ] `rbFPublicSend(1, ">", new BigDecimal("0.5"))` is `true`, covered in a `.trails.test.ts`.
- [ ] A non-Numeric operand still raises `ArgumentError` from the ordering operators.
