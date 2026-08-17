---
title: "converge-apply-join-dependency-sync-eager-residue"
status: ready
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
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

`converge-apply-join-dependency-eager-cluster` (PR pending) collapsed the ASYNC
half of the eager limit/distinct-PK cluster onto a single Rails-shaped
`Relation#applyJoinDependency` (block form) mirroring
`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457-481`,
routing the `distinct_relation_for_primary_key` branch through the adapter method
of that name (`connection-adapters/abstract/schema-statements.ts:1729`, mirroring
`schema_statements.rb:1429-1452`). `_executeEagerLoad`, `_applyJoinDependencyAsync`,
and the four inline re-implementations in `exec_main_query`, `pluck`, `ids` and
`compute_cache_version` are gone, and composite-PK eager limit/offset now works.

What did NOT converge is the SYNCHRONOUS half, which is why these invented
helpers still live in `relation.ts`:

- `_buildEagerJoinDependency` (`relation.ts:1782`)
- `_eagerJoinDependencyIsLimitable` (`:2603`)
- `_applyEagerJoinDependency` (`:2559`)
- `_buildEagerIdSubquery` (`:2639`)
- `_materializeLimitedIds` (`:2686`), `_distinctSelectForLimitedIds` (`:2715`)
- `_deferredDistinctPkEagerSpecs` (`:2375`), `_isDeferredDistinctPkSubquery`,
  `_buildDeferredDistinctPkInlineSubquery`, `_materializeDistinctPkIds`,
  `_materializeDeferredDistinctPkPredicates`
- `_buildEagerOperandManager` (`:2760`), `_eagerLoadBypassesJoinDependency`,
  `_checkEagerLoadable`

They are kept alive by exactly three synchronous entry points that Rails runs
synchronously because Ruby can execute SQL synchronously:

1. `Relation#toSql` (`relation.rb:1210-1222`) — Rails yields through
   `apply_join_dependency`, which may query.
2. `PredicateBuilder::RelationHandler#call`
   (`predicate_builder/relation_handler.rb:8`) — reached from a synchronous
   `.where()`. trails defers the query via the `DeferredDistinctPkIn` marker
   cluster instead.
3. `QueryMethods#build_from` (`query_methods.rb:1789`).

Both (2) and (3) currently call the new async `applyJoinDependency` and capture
the yielded relation from the block, relying on everything before the
`distinct_relation_for_primary_key` `await` being synchronous.

## Acceptance criteria

- Decide and implement the convergence for the synchronous entry points: either
  an async `toSql`/`where` path, or a documented, single-sited language-shortcoming
  deviation that lets every helper above be deleted.
- The invented helpers listed above are deleted from `relation.ts`.
- `_eagerLoadBypassesJoinDependency`'s composite-PK arm is retired — the composite
  PK case now works through `distinctRelationForPrimaryKey`.
- Also converge `eagerLoading?` / `joinedIncludesValues` onto `relation.rb:1238`
  and `:1248` (trails splits them across `_promotedIncludes`,
  `_includesToPromoteFromReferences`, `_includesToPromoteFromJoins`,
  `_joinedIncludesValues`, `_eagerLoadingForSql`).
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.
