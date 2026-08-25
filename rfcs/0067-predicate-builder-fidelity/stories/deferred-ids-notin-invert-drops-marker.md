---
title: "DeferredIdsNotIn#invert decays to plain In, dropping deferred excluding ids"
status: done
updated: 2026-07-23
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 5113
claim: "2026-07-23T01:43:09Z"
assignee: "deferred-ids-notin-invert-drops-marker"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #5064 (predicate-builder-negation-threading-vs-whereclause-invert).

`DeferredDistinctPkIn` / `DeferredDistinctPkNotIn`
(`packages/activerecord/src/relation/predicate-builder/deferred-distinct-pk-in.ts`)
gained `invert()` overrides in #5064 so `WhereClause#invert` over a
positively-built clause preserves the deferred `innerRelation` instead of
decaying to a plain `In`/`NotIn` (the inherited `In#invert` builds
`new NotIn(left, right)` and drops the marker fields).

`DeferredIdsNotIn` (same file, the `excluding`/`without` marker) has NO such
override: `NotIn#invert` on it would produce a plain `In` carrying only the
display-fallback pk-select subquery, silently dropping `literalIds` and
`innerRelations` — the load pipeline
(`relation.ts` `_materializeDeferredDistinctPkPredicates`) would never
materialize the ids, and on MySQL the leftover `IN (SELECT ... LIMIT ...)`
display subquery shape is exactly what the marker exists to avoid. Unreached
today (nothing inverts a clause containing it), but any future path that
inverts a merged/rewhere'd clause (`WhereClause#invert` is now the single
negation mechanism after #5064) trips it silently.

## Acceptance criteria

- [ ] `DeferredIdsNotIn#invert` preserves the marker's deferred payload
      (mirror the `DeferredDistinctPkIn`/`NotIn` pair: return an inverted
      marker carrying `literalIds` + `innerRelations`), or — if an inverted
      excluding-marker is semantically unreachable — make `invert()` throw
      loudly instead of decaying.
- [ ] Unit test: inverting a WhereClause containing the marker does not lose
      the deferred ids (or raises).
