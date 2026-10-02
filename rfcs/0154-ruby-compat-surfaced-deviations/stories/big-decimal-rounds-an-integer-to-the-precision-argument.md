---
title: "ruby-compat: BigDecimal(Integer, precision) rounds where MRI takes the Integer whole"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8387. `BigDecimal(1234, 3)` is `0.1234e4` on ruby 3.3.11: the precision argument rounds a Float or a Rational, and an Integer is taken whole. `BigDecimal(1234.0, 3)` is `0.123e4`.

`packages/ruby-compat/src/big-decimal.ts`'s constructor rounds whenever the value is any JS `number` (`isFloat = typeof value === "number" || boxed instanceof Number`, then `if (parsed.nonFinite === null && ndigits > 0 && (isRational || isFloat))`), so `new BigDecimal(1234, 3)` is `1230`. A whole-valued `number` is the Integer seat everywhere else in ruby-compat (`rbIntegerTypeP`, `rbObjClass`); only a fractional `number` or a boxed `Number` is a Float (`rbFloatTypeP`).

The caller that reaches it is `ActiveModel::Type::Decimal#cast_value`'s `when ::Numeric` arm (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/decimal.rb:52-53`, `BigDecimal(value, precision || BIGDECIMAL_PRECISION)`), which `packages/activemodel/src/type/decimal.ts#castValue` now takes for an Integer-seated number. With an explicit `precision: 3` it answers `1230` for `1234` where Rails answers `1234`.

MRI: `vendor/ruby/v3.3.11/ext/bigdecimal/bigdecimal.c`, `rb_convert_to_BigDecimal` — the `T_FIXNUM` / `T_BIGNUM` arms go to `rb_inum_convert_to_BigDecimal`, which ignores `digs`; `T_FLOAT` and `T_RATIONAL` apply it.

## Acceptance criteria

- [ ] `new BigDecimal(1234, 3)` equals `BigDecimal("1234")`; `new BigDecimal(new Number(1234), 3)` and `new BigDecimal(1234.5, 3)` still round to `1230`.
- [ ] A `.trails.test.ts` case pins both, and a `DecimalType({ precision: 3 }).cast(1234)` case pins `1234`.
- [ ] The constructor's doc cites the `bigdecimal.c` line for the Integer arm.
