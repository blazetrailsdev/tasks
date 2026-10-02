---
title: "activemodel: apply_seconds_precision raises RangeError for a non-Integer precision where Rails does Float arithmetic"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
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

Surfaced by trails#8387. `ActiveModel::Type::Helpers::TimeValue#apply_seconds_precision` (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/helpers/time_value.rb:24-36`):

    number_of_insignificant_digits = 9 - precision
    round_power = 10**number_of_insignificant_digits
    rounded_off_nsec = value.nsec % round_power

    if rounded_off_nsec > 0
      value.change(nsec: value.nsec - rounded_off_nsec)

`packages/activemodel/src/type/helpers/time-value.ts#applySecondsPrecision` takes the power over BigInt (`10n ** BigInt(Math.max(numberOfInsignificantDigits, 0))`). That is exact for every Integer precision, including the negative-exponent case where Ruby's `10 ** -n` is a Rational that divides every Integer nsec. For a non-Integer precision (`3.5`) Ruby does Float arithmetic and answers a changed time; trails raises `RangeError` from `BigInt(5.5)`. The function carries a `@boundary` note saying so. No adapter produces a non-Integer precision, so this is low priority, but it is a raise Rails does not make.

The module-private `nsec` / `changeNsec` helpers in the same file are what force BigInt: they carry nanoseconds as `bigint` across the `Time`, `TimeWithZone` and `Temporal.*` seats. The converged shape either does the arithmetic through ruby-compat's numeric sends (`**`, `%`, `-` over Integer / Rational / Float, as `numericMul` does `*`), or settles that `precision` is Integer-typed at the type's constructor so the Float arm is unreachable by construction.

## Acceptance criteria

- [ ] `applySecondsPrecision` with a non-Integer precision answers what Rails answers, or the precision is rejected where Rails would reject it; it does not raise `RangeError`.
- [ ] The `@boundary` note is deleted or reduced to what still holds.
- [ ] `pnpm parity:api:arms:report --package=activemodel --direction=invented` still shows no row for `applySecondsPrecision`.
