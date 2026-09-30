---
title: "BigIntegerType drops its invented castValue and inherits Type::Integer#cast_value"
status: draft
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::BigInteger` overrides only `serialize_cast_value` and
`max_value` (`vendor/rails/v8.0.2/activemodel/lib/active_model/type/big_integer.rb`);
it inherits `cast_value` (`value.to_i rescue nil`,
`activemodel/lib/active_model/type/integer.rb:84-86`) from `Type::Integer`.

trails' `BigIntegerType` (`packages/activemodel/src/type/big-integer.ts:14-26`)
still overrides `castValue` with its own number / string / bigint arms. Since
trails#8276, `IntegerType#castValue` is `narrowBigInt(toI(value))` with
ruby-compat `toI` exact for a String, so the override adds nothing Rails has.

## Converged shape

Delete `BigIntegerType#castValue`; the class keeps `serializeCastValue` and
`maxValue` only, as `big_integer.rb` does.

## Acceptance criteria

- [ ] `BigIntegerType` defines no `castValue`.
- [ ] `big-integer*.test.ts`, `integer*.test.ts`, PG `bigint` / `DecimalWithoutScale` tests stay green.
