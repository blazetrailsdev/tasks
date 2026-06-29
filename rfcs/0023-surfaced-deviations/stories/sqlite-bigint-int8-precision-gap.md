---
title: "fix: SQLite bigint (int8) column type uses float64 range check, wrongly emits 1=0 for 2^63-1"
status: ready
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4240 (`fix(activerecord): rescue RangeError for out-of-range BigInt binds in OR queries`)
introduced `PgInteger8` and `MysqlBigInteger` — adapter-specific subclasses of `BigIntegerType`
with BigInt-precision `isInRange`/`isSerializable` — to fix float64 imprecision at the int8
boundary (2^63).

SQLite's bigint column type is still `IntegerType({ limit: 8 })` (registered via the SQLite
adapter's type map or the default `registerIntegerType` path). `IntegerType.castValue` converts
BigInt to `Number()` before the range check. At the 2^63-1 boundary:

````ts
Number(9223372036854775807n)  // → 9223372036854775808.0 (float rounds up to 2^63)
maxValue() for limit=8        // → 2**(8*8-1) = 9223372036854775808.0 (same float)
Math.abs(value) < maxValue()  // → false (wrongly: 9223372036854775807 IS in range)
```ts

So `isInRange(9223372036854775807n)` returns false, `ensureInRange` throws, and
`QueryAttribute#isUnboundable()` fires for a perfectly valid value. A query like
`Post.where(id: 9223372036854775807n)` on SQLite would generate `1=0` and silently
return no rows instead of finding the record.

Rails `IntegerType` uses Ruby's arbitrary-precision integers so the comparison is exact.
This is a float64-specific deviation that only manifests on the SQLite lane.

## Acceptance criteria

- [ ] SQLite adapter registers a `SqliteBigInteger extends BigIntegerType` (or equivalent)
      for its bigint/int8 column type that uses BigInt-precision `isInRange`/`isSerializable`,
      matching the pattern of `PgInteger8` and `MysqlBigInteger`.
- [ ] `Post.where(id: 9223372036854775807n)` on SQLite finds the record (does not generate `1=0`).
- [ ] `Post.where(id: 9223372036854775808n)` on SQLite still correctly emits `1=0` (out of range).
- [ ] All three adapter lanes pass `or.test.ts`.
````
