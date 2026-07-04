---
title: "IntegerType#cast_value loses BigInt precision via Number() above MAX_SAFE_INTEGER"
status: in-progress
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 4552
claim: "2026-07-04T15:34:29Z"
assignee: "integertype-castvalue-bigint-precision-loss"
blocked-by: null
closed-reason: null
---

## Context

Follow-up surfaced by integer-type-bigint-precise-range (PR #4533), which made
`IntegerType#isInRange` / `serializable?` / `ensure_in_range` compare in BigInt
space. The _range check_ is now Rails-faithful, but the _cast_ is still lossy:

- `packages/activemodel/src/type/integer.ts:100` (`castValue` bigint branch)
  does `Number(value)`, and the number path truncates via
  `BigInt(Math.trunc(value))` only after values have already passed through
  float64.

Net effect: base `IntegerType({ limit: 8 }).serialize(9223372036854775807n)`
(= 2^63 - 1, an in-range value) wrongly raises `ActiveModelRangeError`, because
`Number(9223372036854775807n)` rounds _up_ to `9223372036854775808` (2^63),
which `ensureInRange` then rejects. Rails' arbitrary-precision `to_i`-based
`cast_value` returns `9223372036854775807` unchanged
(activemodel integer.rb:123-126 — `assert_equal(9223372036854775807,
type.serialize(9223372036854775807))`).

This is why our port of the Rails test "columns with a larger limit have larger
ranges" (packages/activemodel/src/type/integer.test.ts:148) is still weakened
(tests `cast` of MAX_SAFE_INTEGER instead of `serialize` of 2^63-1 and the
`RangeError` on 2^63) — it cannot yet round-trip the exact bignum. `IntegerType`
is `ValueType<number>`-backed, so a full fix likely means preserving BigInt
through the cast for `limit: 8` (as `BigIntegerType`/`PgInteger8`/
`MysqlBigInteger` already do) or otherwise avoiding the lossy `Number()`.

## Acceptance criteria

- [ ] `IntegerType({ limit: 8 }).serialize(9223372036854775807n)` returns
      `9223372036854775807` (no precision loss, no false RangeError);
      `serialize(-9223372036854775808n)` returns `-9223372036854775808`.
- [ ] Converge the "columns with a larger limit have larger ranges" test body to
      Rails verbatim (serialize of 2^63-1 and -2^63 round-trip; RangeError on
      the 10^31 over-range literals) instead of the current weakened `cast`
      assertions.
- [ ] No regression to isInRange/serializable BigInt precision from PR #4533.
