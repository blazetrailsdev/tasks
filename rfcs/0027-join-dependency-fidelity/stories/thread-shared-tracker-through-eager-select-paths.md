---
title: "Thread the shared build_joins AliasTracker through the eager-SELECT / limited-ids paths"
status: in-progress
updated: 2026-06-30
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 3
pr: 4297
claim: "2026-06-29T23:54:33Z"
assignee: "thread-shared-tracker-through-eager-select-paths"
blocked-by: null
---

## Context

PR #3912 (defer-join-alias-assignment-to-emit-time) moved first-use join
aliasing to emit-time `makeConstraints` against the shared `build_joins`
AliasTracker. The merged-join / live-SelectManager path (`_applyJoinsToManager`,
relation.ts) and the `from`-subquery path (`buildJoins`, query-methods.ts) thread
the single `buildMergedJoinAliasTracker` shared tracker (seeded with the base
table, `_joinValues`, `_joinClauses`) through every `joinConstraints`.

But the eager-load SELECT-preview paths do NOT: `_buildEagerJoinManager`
(relation.ts ~4674) and `_buildEagerIdSubquery` (relation.ts ~4758) both call
`jd.joinConstraints([], undefined, this._aliasableReferences())`, i.e. a FRESH
per-emit tracker seeded only with the base table. So an
`includes(:author).references(:author)` co-occurring with an explicit `.joins`
onto `authors` won't collide/alias against the manual join in these paths — the
eager JD's tracker and the `_applyJoinsToManager` shared tracker never see each
other.

This matches Rails `build_joins`, which shares ONE `alias_tracker` across the
eager-load JD and the folded explicit string joins
(active_record/relation/query_methods.rb build_joins; join_dependency.rb:189-211).
It is NOT a regression from PR #3912 (the old code emitted construction-aliased
`jd.nodes` here, equally tracker-isolated), but it remains a fidelity gap.

## Acceptance criteria

- [ ] `_buildEagerJoinManager` and `_buildEagerIdSubquery` thread the single
      shared `build_joins` AliasTracker (the one `buildMergedJoinAliasTracker`
      builds for `_applyJoinsToManager`) into `jd.joinConstraints`, instead of a
      fresh `undefined` per-emit tracker.
- [ ] An eager `includes(:x).references(:x)` combined with an explicit `.joins`
      onto the same table aliases the colliding join (add a test mirroring the
      Rails case).
- [ ] Existing eager / limited-ids / merge tests stay green; `test:compare` and
      `api:compare` non-negative.
