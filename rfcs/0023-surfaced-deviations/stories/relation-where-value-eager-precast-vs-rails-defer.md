---
title: "Relation#where eager pre-cast diverges from Rails' defer-to-bind casting"
status: draft
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Relation#where` never pre-casts scalar hash values — it hands them raw
to `PredicateBuilder`, and the `QueryAttribute` bind casts/serializes only at
compile time (`build_bind_attribute` → `value_for_database`). trails instead
eagerly casts every `where` value up front in
`Relation#_castWhereValue` (`packages/activerecord/src/relation.ts`, via
`Base._castAttributeValue`, string-only). This is a trails invention with no
Rails analog.

PR #4848 (predicate-builder-blank-and-unboundable-contradiction) patched the
observable symptom of this deviation: an un-castable string
(`where(parent_id: "not-a-number")`, `where(written_on: "")`, and the same
element inside an array) was pre-cast to `null`, which routed the predicate
onto the explicit-nil `IS NULL` path instead of Rails' `col = NULL` /
`IN (NULL)` (matches nothing). The fix (`_castPreservingUncastable`) re-preserves
the raw value when the cast collapses a non-null input to null — but the eager
pre-cast machinery itself remains and can still hide divergences (e.g. it only
casts `typeof value === "string"`, so a numeric/boolean/BigDecimal for a string
column, or a normalized/force-equality column, takes a different path than
Rails' uniform bind serialization).

Trails source: `Relation#_castWhereValue` and `_castPreservingUncastable`
(relation.ts, ~line 5719), `Base._castAttributeValue` (base.ts:2303).
Rails source: `PredicateBuilder#build` (predicate_builder.rb:57-69) →
`build_bind_attribute`, `QueryAttribute#value_for_database`
(query_attribute.rb), `ArrayHandler#call` (predicate_builder/array_handler.rb).

## Acceptance criteria

- [ ] Audit whether `_castWhereValue` can be removed entirely, letting the
      `QueryAttribute` bind own all casting/serialization at compile time
      (Rails' design), or document the specific trails constraints that require
      keeping it (force-equality/OID::Array element corruption, PK int8→BigInt,
      etc.) as SKIP_GROUPS-style rationale.
- [ ] Any pre-cast that remains must not change the predicate SHAPE relative to
      Rails (no string-only special-casing that routes non-string scalars
      differently; no collapse-to-nil that flips `= NULL` into `IS NULL`).
- [ ] Add/port coverage for the non-string un-castable cases surfaced by the
      audit (numeric/boolean/decimal for string columns already have Rails
      tests in where_test.rb — verify they still hold if the machinery changes).
