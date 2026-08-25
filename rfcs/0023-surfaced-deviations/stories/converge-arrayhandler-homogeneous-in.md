---
title: "converge-arrayhandler-homogeneous-in"
status: done
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4440
claim: "2026-07-02T21:23:58Z"
assignee: "converge-arrayhandler-homogeneous-in"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by converge-finder-bignum-out-of-range (PR #4433). Rails'
`ActiveRecord::PredicateBuilder::ArrayHandler#call`
(activerecord/lib/active_record/relation/predicate_builder/array_handler.rb:21)
builds the multi-value case with
`Arel::Nodes::HomogeneousIn.new(values, attribute, :in)`, whose
`casted_values` (arel/nodes/homogeneous_in.rb:39-47) natively does
`type.serialize(raw) if type.serializable?(raw)` then `compact!` — i.e. drops
out-of-range / non-serializable values and casts per-column-type.

trails' `ArrayHandler.call`
(packages/activerecord/src/relation/predicate-builder/array-handler.ts:74-82)
instead builds a plain `attribute.in(scalarValues)` (`Nodes.In`). PR #4433
worked around the missing unboundable filter by pre-substituting an
`UnboundableBound` sentinel via `PredicateBuilder.markUnboundable`, which the
`In`/`NotIn` visitor then drops. trails already HAS a `HomogeneousIn` node
(packages/arel/src/nodes/homogeneous-in.ts) that is not wired into ArrayHandler.

## Acceptance criteria

- [ ] `ArrayHandler.call`'s multi-value branch builds `HomogeneousIn` (as Rails
      does), and `buildNegatedArray`'s multi-value NOT IN branch likewise.
- [ ] `HomogeneousIn.castedValues` filtering replaces the `markUnboundable`
      sentinel workaround for the IN/NOT IN paths (remove the sentinel
      substitution from ArrayHandler / buildNegatedArray if HomogeneousIn covers
      it; keep it for the range path unless that too converges).
- [ ] `HomogeneousIn.castedValues` calls the correct trails serializable method
      (`isSerializable`, not the currently-dead `caster.serializable`).
- [ ] No regression across SQLite / MySQL / PostgreSQL; the bignum `IN (1)` /
      `1=0` behavior from #4433 is preserved.
