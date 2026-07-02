---
title: "Unify PredicateBuilder type-resolution cascades; type positive equality bind via resolveBoundType"
status: ready
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
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

Surfaced by converge-finder-bignum-out-of-range (PR #4433). trails'
`PredicateBuilder` has three near-duplicate column-type resolution cascades:

- `resolveBoundType` (packages/activerecord/src/relation/predicate-builder.ts):
  `attribute.relation.typeForAttribute` → `this._tableContext.typeForAttribute`
  → `this.table.typeForAttribute`. Used by the range-handler cast, the range/IN
  unboundable sentinel, and `buildNegated` (via `bindAttributeFor`).
- `_buildRangeEqualityOrNull`'s inline `lookups` array — same cascade, duplicated.
- `buildBindAttribute(columnName, value)` — the narrow `this.table.typeForAttribute`
  lookup only (Rails' `build_bind_attribute`, which uses the builder's own
  `table.type`).

The _positive_ single-value equality path
(`BasicObjectHandler` → `predicateBuilder.buildBindAttribute`) still uses the
narrow lookup, so `where(joined_col: bigOOR)` on a joined/aliased column whose
type lives on `attribute.relation`/`_tableContext` (but not `this.table`) can
fall through to the identity fallback type — neither raising
`ActiveModelRangeError` nor collapsing the equality to `1=0` (silently binding a
raw out-of-range value). PR #4433 fixed the range/IN/negation paths but left this
positive path (hottest in the builder, pre-existing, symmetric with Rails'
per-association re-rooting of `table`) as-is to keep scope tight.

## Acceptance criteria

- [ ] The positive single-value equality path types its bind via the same
      resolveBoundType cascade the range/negation paths use (so a joined/aliased
      OOR equality collapses to `1=0` instead of silently binding a raw value).
- [ ] The three type-resolution cascades (`resolveBoundType`,
      `_buildRangeEqualityOrNull`'s inline `lookups`, and `buildBindAttribute`'s
      narrow lookup) are unified into one shared resolver; `buildBindAttribute`
      keeps its Rails-faithful `(columnName, value)` signature.
- [ ] No regression across SQLite / MySQL / PostgreSQL; existing scalar-equality
      SQL for non-joined columns is byte-identical (resolveBoundType already
      falls back to `this.table`).
