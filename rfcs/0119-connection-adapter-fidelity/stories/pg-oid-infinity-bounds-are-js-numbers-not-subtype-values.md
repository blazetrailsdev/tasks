---
title: "PG OID infinity bounds are JS numbers where Rails carries the subtype's own infinity"
status: draft
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `adapters/postgresql/pg-range.ts` onto
`RangeType#castValue` (#7562). Three call sites in
`packages/activerecord/src/connection-adapters/postgresql/oid/` model Rails'
infinity bounds as JS `number` identity, where Rails duck-types on
`infinite?` and carries the subtype's OWN infinity value.

1. `oid/decimal.ts:4-6` — `Decimal#infinity` returns the JS number
   `Infinity` / `-Infinity`. Rails returns a BigDecimal:
   `BigDecimal("Infinity") * (options[:negative] ? -1 : 1)`
   (`activerecord/lib/active_record/connection_adapters/postgresql/oid/decimal.rb:8-10`).
   Rails asserts the BigDecimal form directly:
   `BigDecimal("-Infinity")...BigDecimal("Infinity")` in
   `test_numrange_values` (`activerecord/test/cases/adapters/postgresql/range_test.rb:139-145`).

2. `oid/range.ts`'s `isInfinity` is
   `value === Infinity || value === -Infinity`. Rails is
   `value.respond_to?(:infinite?) && value.infinite?` (`range.rb:117-119`) —
   true for a BigDecimal infinity as well as a Float one. `type_cast_single`
   (`range.rb:74-76`) uses it to decide whether to skip `subtype.deserialize`,
   and `cast_value` (`range.rb:53`) to decide whether an excluded start
   raises, so the narrow check sends a BigDecimal infinity bound down the
   wrong arm of both.

3. `oid/range.ts`'s `infiniteFloatRangeCovers` is
   `typeof value === "number" && !Number.isNaN(value)`, standing in for
   Rails' `INFINITE_FLOAT_RANGE = (-::Float::INFINITY)..(::Float::INFINITY)`
   plus `cover?` (`range.rb:86-93`). `cover?` is true for any Comparable in
   that span, BigDecimal included; the `typeof` test is false for one, so
   `sanitize_bounds` nils a bound Rails keeps.

The three are one knot: (1) is what makes (2) and (3) look adequate today,
because no trails subtype currently returns a non-number infinity.

## Converged shape

- `Decimal#infinity` returns `BigDecimal("Infinity")`, negated for
  `negative: true`, per `decimal.rb:8-10`.
- `isInfinity` duck-types the way `range.rb:117-119` does — an `infinite?`
  responder answering truthy — rather than testing numeric identity.
- `sanitizeBounds` compares against an `INFINITE_FLOAT_RANGE` constant with
  Range `cover?` semantics, as `range.rb:86-93` does, instead of a `typeof`
  helper. `infiniteFloatRangeCovers` is invented surface and goes away.

## Acceptance criteria

- `oid/decimal.ts` returns a BigDecimal infinity, matching `decimal.rb:8-10`.
- `isInfinity` and `sanitizeBounds` in `oid/range.ts` recognize a BigDecimal
  infinity bound, matching `range.rb:86-93,117-119`.
- `infiniteFloatRangeCovers` is deleted.
- A numrange test covers the `BigDecimal("-Infinity")...BigDecimal("Infinity")`
  bounds Rails asserts in `range_test.rb:139-145`.
- The PostgreSQL adapter lane stays green.
