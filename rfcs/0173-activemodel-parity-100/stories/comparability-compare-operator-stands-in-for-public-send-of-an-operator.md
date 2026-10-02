---
title: "activemodel: compareOperator stands in for value.public_send(COMPARE_CHECKS[option], option_value)"
status: done
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8409
claim: "2026-10-02T16:41:58Z"
assignee: "arel-attribute-and-sql-literal-are-not-nodes"
blocked-by: null
closed-reason: null
---

## Context

Both comparing validators send the operator Symbol to the value:

- `vendor/rails/v8.0.2/activemodel/lib/active_model/validations/comparison.rb:27`
  — `unless value.public_send(COMPARE_CHECKS[option], option_value)`
- `vendor/rails/v8.0.2/activemodel/lib/active_model/validations/numericality.rb:60`
  — the same line in the `COMPARE_CHECKS` arm.

`COMPARE_CHECKS` (`validations/comparability.rb:6-8`) maps each option to
`:>`, `:>=`, `:==`, `:<`, `:<=`, `:!=`.

trails cannot `rbFPublicSend` an operator onto a JS number, so
`packages/activemodel/src/validations/comparability.ts:30` adds
`compareOperator(op, a, b)`, a `switch` over the six operator strings, and both
validators call it with `rbCmpint(cmp(value, optionValue), value, optionValue)`
and `0` (`validations/comparison.ts:38`, `validations/numericality.ts:110`).
`comparability.rb` defines `COMPARE_CHECKS` and `error_options` only, so the
function is extra surface; it carries
`@noRailsEquivalent CONVERGEABLE comparability-compare-operator-stands-in-for-public-send-of-an-operator`.

No CLAUDE.md section ratifies it. Operator dispatch is a Ruby core concern —
`Comparable#>` and friends are `vendor/ruby/v3.3.11/compar.c` — so the seat is
ruby-compat (see `ruby-compat-comparable`, and `OPERATOR_SPELLING_BY_FQN` in
`scripts/api-compare/operator-order-spelling.ts` for how an operator is
spelled), not an activemodel helper.

The neighbouring arms have the same shape and are inlined:
`value.to_i.public_send(NUMBER_CHECKS[option])` (`numericality.rb:51`) is a
hand-written odd/even test at `numericality.ts:93-96`.

Found by `activemodel-audit-permanent-receipts-subdirs`.

## Acceptance criteria

- [ ] `value.public_send(COMPARE_CHECKS[option], option_value)` is one send in
      both validators, through a ruby-compat seat that dispatches a Ruby
      operator Symbol (an incomparable pair still raises Ruby's `ArgumentError`).
- [ ] `compareOperator` and its receipt are deleted from `comparability.ts`.
- [ ] The `NUMBER_CHECKS` arm sends `:odd?` / `:even?` the same way, or is filed.
- [ ] `comparison-validation.test.ts` and `numericality-validation.test.ts` stay green.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm parity:api:calls && pnpm vitest run packages/activemodel/src/validations
```
