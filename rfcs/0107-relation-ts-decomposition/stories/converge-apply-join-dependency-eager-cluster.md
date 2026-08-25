---
title: "Converge the eager-load limit/distinct-PK cluster onto apply_join_dependency"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["retire-relation-parallel-join-resolver"]
deps-rfc: []
est-loc: 575
priority: null
pr: 6634
claim: "2026-08-17T09:26:07Z"
assignee: "converge-apply-join-dependency-eager-cluster"
blocked-by: null
closed-reason: null
---

## Context

Rails' whole "eager-load with a LIMIT/OFFSET or a DISTINCT primary key" story
is `apply_join_dependency` and `distinct_relation_for_primary_key`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:462-481`)
— about 30 lines.

`relation.ts` carries ~400 lines of bespoke machinery for it, none of which has
a Rails counterpart:

- `_executeEagerLoad` (144 lines, `relation.ts:2673`)
- `_buildEagerIdSubquery` (47 lines, `:5158`)
- `_materializeDeferredDistinctPkPredicates` (50 lines, `:4904`)
- `_distinctSelectForLimitedIds` (45 lines, `:5233`)
- `_eagerJoinDependencyIsLimitable` (36 lines, `:5122`)
- `_eagerLoadBypassesJoinDependency` (49 lines, `:3096`)
- `_applyEagerJoinDependency` (44 lines, `:5078`)
- `_materializeDistinctPkIds` (`:4877`), `_materializeLimitedIds` (`:5205`)
- `_deferredDistinctPkEagerSpecs` (`:4827`), `_isDeferredDistinctPkSubquery`
  (`:4846`), `_buildDeferredDistinctPkInlineSubquery` (`:4864`)
- `_buildEagerSql` (`:5278`), `_buildEagerOperandManager` (`:5291`),
  `_buildEagerJoinDependency` (`:2669`), `_eagerLoadingForSql` (`:5058`)
- `_includesToPromoteFromReferences` (`:2507`), `_includesToPromoteFromJoins`
  (`:2541`), `_joinedIncludesValues` (`:2521`), `_resolveAssocTables` (`:2552`),
  `_aliasableReferences` (`:2574`), `_checkEagerLoadable` (`:3145`)

trails also carries an invented async twin `_applyJoinDependencyAsync`
(`relation.ts:4796`) alongside the Rails-named `applyJoinDependency` (`:4738`).
That split is already recorded in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json` (row:
`apply_join_dependency` / `skip_query_cache_if_necessary`, RFC 0106) — that row
should converge here rather than persist.

Note `relation.rb` genuinely owns `eager_loading?` (`:1238`),
`joined_includes_values` (`:1248`), `references_eager_loaded_tables?` (`:1474`)
and `tables_in_string` (`:1491`) — those stay, converged onto the Ruby bodies.
Everything in the list above does not.

Depends on the `build_arel` and `JoinDependency` convergence stories.

## Acceptance criteria

- Eager loading with limit/offset and the distinct-PK path go through a single
  `applyJoinDependency` mirroring `finder_methods.rb:462-481`, with
  `distinctRelationForPrimaryKey` extracted under the Rails name as Rails
  extracts it.
- The invented helpers listed above are deleted.
- `_applyJoinDependencyAsync` is retired and its baseline row in
  `call-mismatches-exclude/activerecord/relation.json` is deleted by hand
  (no `--write`, no reseed), followed by
  `pnpm parity:api:calls:tighten activerecord/relation.json`.
- `eagerLoading`, `joinedIncludesValues`, `referencesEagerLoadedTables` and
  `tablesInString` bodies match `relation.rb:1238`, `:1248`, `:1474`, `:1491`.
- Eager-load SQL and results unchanged across all three adapters; the
  `relation/*.test.ts` suites and the CPK eager tests pass unchanged.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.

## Re-measured 2026-08-16

Estimate corrected 500 -> 575. The cluster still in `relation.ts` measures
**572 lines**: `_executeEagerLoad` (95, `relation.ts:2748`),
`_eagerLoadBypassesJoinDependency` (49, `:2861`), `_buildEagerIdSubquery` (47,
`:3685`), `_distinctSelectForLimitedIds` (44, `:3761`),
`_applyEagerJoinDependency` (44, `:3605`),
`_materializeDeferredDistinctPkPredicates` (42, `:3498`),
`_eagerJoinDependencyIsLimitable` (36, `:3649`), `_materializeLimitedIds` (29,
`:3732`), `_buildEagerOperandManager` (29, `:3805`),
`_materializeDistinctPkIds` (27, `:3471`), plus the promotion helpers. Line
numbers are against `main` at `27a6d46bb`; the earlier citations in this body
predate the fan-outs.

`_promotedIncludes` (`relation.ts:2577`, 14 lines) is tracked separately by
`converge-relation-select-and-join-residue` — absorb it here if it is already
in your diff, and say so in the PR so that story can drop the bullet.
