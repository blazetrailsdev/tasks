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

Line numbers are against PR #6634's head (`08a6c83ff`). The eager-JOIN /
distinct-PK builders:

- `_eagerJoinDependencyIsLimitable` (`relation.ts:2598`)
- `_applyEagerJoinDependency` (`:2555`)
- `_buildEagerIdSubquery` (`:2634`)
- `_materializeLimitedIds` (`:2681`), `_distinctSelectForLimitedIds` (`:2710`)
- `_buildEagerOperandManager` (`:2754`)

The deferred distinct-PK marker cluster (the `.where()` half):

- `_deferredDistinctPkEagerSpecs` (`:2359`), `_isDeferredDistinctPkSubquery`
  (`:2378`), `_buildDeferredDistinctPkInlineSubquery` (`:2400`),
  `_materializeDistinctPkIds` (`:2417`),
  `_materializeDeferredDistinctPkPredicates` (`:2448`), plus
  `relation/predicate-builder/deferred-distinct-pk-in.ts`

The `eager_loading?` split (`relation.rb:1238`, `:1248`), which is what the
promotion helpers are:

- `_eagerLoadingForSql` (`:2535`), `_promotedIncludes` (`:1651`),
  `_includesToPromoteFromReferences` (`:1665`), `_joinedIncludesValues`
  (`:1679`), `_includesToPromoteFromJoins` (`:1699`)

And the two capability-gap guards:

- `_eagerLoadBypassesJoinDependency` (`:1833`), `_checkEagerLoadable` (`:1886`)

(`_buildEagerJoinDependency` was on this list and is already deleted in #6634 —
its body was exactly `construct_join_dependency`, query_methods.rb:1598.)

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
- `exec_queries`' preload list derives from `eager_loading?` as Rails does
  (`preload += includes_values unless eager_loading?`, relation.rb:1321-1322)
  rather than from `_promotedIncludes`. Today the Preloader's already-loaded
  skip masks the difference (no extra SQL is emitted), but the list itself is
  not the Rails one.
- Also converge `eagerLoading?` / `joinedIncludesValues` onto `relation.rb:1238`
  and `:1248` (trails splits them across `_promotedIncludes`,
  `_includesToPromoteFromReferences`, `_includesToPromoteFromJoins`,
  `_joinedIncludesValues`, `_eagerLoadingForSql`).
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.
