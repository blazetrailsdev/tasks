---
title: "integer-type-bigint-precise-range"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging ArrayHandler onto HomogeneousIn (PR #4440,
converge-arrayhandler-homogeneous-in). trails'
`ActiveModel::Type::Integer` range-checks by coercing through
`Number(value)`:

- `packages/activemodel/src/type/integer.ts:59` (`isSerializable`) and
  `:100` (`castValue` bigint branch) both do `Number(value)`.
- `range` (`:76-78`) computes `maxValue()-1` as a JS float.

For an 8-byte (`limit: 8`) column, `maxValue() = 2**63 = 9223372036854775808`
is exactly representable as a float, but `maxValue()-1 = 9223372036854775807`
rounds _up_ to `9223372036854775808`. Combined with `Number(2n**63n)` also
being `9223372036854775808`, `isInRange` returns true and `serialize` does
not raise. Net effect: `IntegerType.isSerializable(2n**63n)` returns `true`
and `serialize` yields `9223372036854776000` for an 8-byte PK — Rails'
arbitrary-precision `serializable?`/`in_range?` (activemodel integer.rb:74-90)
correctly returns `false` (half-open `min...max`, exclusive max).

This is why neither `HomogeneousIn#castedValues` (via `isSerializable`) nor
the older `markUnboundable` sentinel (via `serialize` raising) can drop an
exactly-`2**63` value on an 8-byte column — both share the same imprecise
`isInRange`. The imprecision predates PR #4440 (identical on `origin/main`)
and is behavior-equivalent across the old and new IN paths, so #4440 does not
regress it; but it is a real fidelity gap.

## Acceptance criteria

- [ ] `IntegerType.isInRange` / `serializable?` / `ensure_in_range` compare in
      BigInt (or otherwise arbitrary-precision) space so an exactly-`2**63`
      value on an 8-byte column is detected out of range, matching Rails'
      half-open `min_value...max_value` (exclusive max).
- [ ] `IntegerType.isSerializable(2n**63n)` on an 8-byte column returns `false`;
      `isSerializable(2n**63n - 1n)` returns `true`; negative boundary
      (`-2n**63n` in, `-2n**63n - 1n` out) likewise.
- [ ] A `where({ id: [big, negBig] })` (all-out-of-range) multi-value array
      then renders `id IN (NULL)` (empty `castedValues`) and
      `whereNot(...)` → `id NOT IN (NULL)`, exercised end-to-end on
      SQLite/MySQL/PostgreSQL.
- [ ] No regression to the existing "exists with large number" finder test.
