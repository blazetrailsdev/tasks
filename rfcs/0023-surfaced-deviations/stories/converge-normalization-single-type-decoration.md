---
title: "Converge normalizes onto a single read+write type-decoration path"
status: claimed
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-07-06T02:06:26Z"
assignee: "converge-normalization-single-type-decoration"
blocked-by: null
closed-reason: null
---

## Context

Rails wires `normalizes` in one place: `ActiveRecord::Normalization.normalizes`
(`vendor/rails/activerecord/lib/active_record/normalization.rb:88`) decorates the
attribute's cast type with `NormalizedValueType` via `decorate_attributes`, so a
single type governs BOTH the write path (assignment/cast) and the read/query path
(`type_for_attribute(name).cast/serialize`).

trails splits this across two mechanisms (PR #4621):

- Writes normalize imperatively via `Model._applyNormalization` in
  `_writeAttribute` (`packages/activemodel/src/model.ts`).
- Queries normalize via a separate wrapper applied only in the query-side type
  caster `TypeCaster::Map.decorateWithNormalizer`
  (`packages/activerecord/src/type-caster/map.ts`) plus a nil-routing peek in
  `PredicateBuilder#build` (`packages/activerecord/src/relation/predicate-builder.ts`).

An attempt to converge onto Rails' single-decoration path during PR #4621 failed
because `decorateAttributes`' immediate-apply + pending-replay double-applied
non-idempotent normalizers (the "minimizes number of times normalization is
applied" test). Converging cleanly needs the attribute-decoration pipeline to
apply a normalizer exactly once per attribute across seed + pending replay.

The pre-existing AR mirror `NormalizedValueType` class and `normalize` helper in
`packages/activerecord/src/normalization.ts` are currently dead (api:compare
surface only); a successful convergence should make them (or the activemodel
`normalizedValueType`) the single live implementation.

## Acceptance criteria

- [ ] `normalizes` decorates the attribute cast type once so the SAME type drives
      write-path cast and query-path cast/serialize, matching normalization.rb:88.
- [ ] Non-idempotent normalizers apply exactly once per write (guard the
      seed+pending-replay double-apply); the "minimizes number of times
      normalization is applied" test stays green.
- [ ] Remove the now-redundant imperative `_applyNormalization` write hook and/or
      the query-side `Map.decorateWithNormalizer` + `PredicateBuilder` peek once a
      single path covers both; reconcile the dead AR `NormalizedValueType`/`normalize`.
- [ ] normalized-attribute.test.ts stays fully green (all 16), no query/dirty regressions.
