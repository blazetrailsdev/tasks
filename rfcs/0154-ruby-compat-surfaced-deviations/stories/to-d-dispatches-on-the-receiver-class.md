---
title: "ruby-compat: toD dispatches on the receiver's class as toI does"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by trails#8494. Rails' `type_cast_calculated_value`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:633-636`) casts an
integer or decimal average with `value&.to_d`. `to_d` is defined per receiver class in
`bigdecimal/util` (`vendor/ruby/v3.3.11/ext/bigdecimal/lib/bigdecimal/util.rb`): `Integer#to_d`,
`Float#to_d` (with `Float::DIG` precision), `String#to_d`, `BigDecimal#to_d` (self),
`Rational#to_d(precision)` and `NilClass#to_d`.

ruby-compat's `toD` (`packages/ruby-compat/src/big-decimal.ts:469`) is `String#to_d` only, typed
`(str: string)`. So `packages/activerecord/src/relation/calculations.ts#typeCastCalculatedValue`
spells the send `toD(String(value))`: a Float, Integer or BigDecimal average is turned to its
decimal text and parsed back. A non-finite BigDecimal (`NaN`, `Infinity`) parses loosely to `0`,
where `BigDecimal#to_d` answers the receiver.

`toI` (`packages/ruby-compat/src/numeric.ts:151`) is the model: one function dispatching on the
receiver's class, raising `NoMethodError` for a receiver with no such method.

## Acceptance criteria

- [ ] ruby-compat's `toD` dispatches on the receiver as `toI` does: String, Integer (number / bigint), Float, BigDecimal (identity) and nil, each cited to `bigdecimal/util.rb`, with tests.
- [ ] `typeCastCalculatedValue`'s average arm is `value == null ? null : toD(value)` with no `String()` wrap, and every other `toD(String(...))` call site in the repo is moved.
- [ ] `calculations.test.ts` green; `pnpm parity:api:extra:gate` green with the receipt on `toD` unchanged.
