---
title: "close-composite-pk-through-eager-bypass-for-scoped-source"
status: draft
updated: 2026-07-17
rfc: "0054-nested-through-association-fidelity"
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

`converge-through-preload-to-one-source-includes-eager-load` (PR #4917, MERGED)
converged the through-preload source join in
`packages/activerecord/src/associations/preloader/through-association.ts`
`_buildThroughScope` onto Rails' single `through_scope` branch (copy the full
reflection `where_clause` and eager-JOIN the source via
`includes!`/`references!`,
`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:117-141`)
AND narrowed `Relation#_eagerLoadBypassesJoinDependency` so a composite-PK base
bypasses the eager JoinDependency ONLY for a limit/offset over non-limitable
(collection) reflections (gated on
`hasLimitOrOffset && !_applyJoinDependencyIsLimitable(...)`). Unlimited
composite-PK eager loads — including the through-preloader's own
`includes(source).references(...)` query and any composite-PK
`includes(:belongs_to)` — now apply the JoinDependency and JOIN like Rails. The
through-scoped-source case is CLOSED.

The remaining composite-PK eager gap is the limited-ids subquery path:
`_materializeLimitedIds` / `_distinctSelectForLimitedIds`
(`packages/activerecord/src/relation.ts`) project the primary key as a SINGLE
column, so a collection eager load with LIMIT/OFFSET on a composite-PK base emits
`cpk_orders."shop_id,id"` → `no such column`. That is why the narrowed bypass
still degrades the LIMIT+collection+composite case to preload (keeping
`EagerAssociationTest > preloading has_many with cpk` green). Rails always applies
the JoinDependency + `distinct_relation_for_primary_key`
(`activerecord/lib/active_record/relation/finder_methods.rb:463-488`).

## Acceptance criteria

- [ ] `_materializeLimitedIds` / `_distinctSelectForLimitedIds` project and read
      a composite primary key as its individual columns (multi-column DISTINCT +
      `(pk_a, pk_b) IN (...)` rewrite), so a collection eager load with
      LIMIT/OFFSET on a composite-PK base emits valid SQL.
- [ ] Drop the `hasLimitOrOffset && !_applyJoinDependencyIsLimitable(...)`
      composite-PK arm of `Relation#_eagerLoadBypassesJoinDependency` so a
      LIMIT+collection eager load on a composite-PK base
      (`preloading has_many with cpk`) runs through the JoinDependency +
      distinct-pk materialization (single JOIN), matching Rails.
- [ ] No regression in eager, CPK-eager, HABTM, has_many/has_one-through,
      nested-through, and through-association-scope suites.
