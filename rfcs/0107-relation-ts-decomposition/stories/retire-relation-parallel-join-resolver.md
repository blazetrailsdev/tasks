---
title: "Route joins() through JoinDependency; delete relation.ts's parallel join resolver"
status: ready
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: ["activerecord"]
deps: ["converge-relation-build-arel-single-builder"]
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`relation.ts:1556-1946` resolves association joins by hand, inspecting
`assocDef.options` to derive foreign keys and build join clauses:

- `_resolveAssociationJoin` (105 lines, `relation.ts:1645`)
- `_resolveThroughJoin` (153 lines, `:1750`) — including the nested-through arm
- `_resolveHabtmJoin` (48 lines, `:1903`)
- `_resolveHasManyJoin` (41 lines, `:733`)
- `_resolveHasManySubquery` (35 lines, `:698`)
- `_deriveForeignKey` (43 lines, `:1590`)
- `_appendAssociationScope` (34 lines, `:1556`)
- `_isAssociationName` (`:1633`)
- `_isNamedJoinValue` (64 lines, `:414`)
- `_whereChainReflection` (`:682`)

Rails does none of this in `relation.rb`. Foreign-key derivation, through/HABTM
chain walking and association-scope application are
`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb`
and `associations/join_dependency/join_association.rb`, driven from
`query_methods.rb`'s `build_joins` / `select_association_list`.

**trails already has a `JoinDependency`** — `relation.ts:2669`
`_buildEagerJoinDependency` constructs one for the eager path, and
`relation/query-methods.ts` `buildJoinDependencies` / `selectAssociationList`
port the Rails entry points. So the eager path and the plain-`joins` path use
two different, independently-maintained join resolvers.

`_appendAssociationScope`'s own JSDoc (`relation.ts:1546`) documents that it
diverges from `associations/join-dependency.ts:272-282` in how it evaluates
scopes — a divergence between the two resolvers that is already known and
written down.

The cluster is leaking outward and should be stopped before it spreads
further:

- `associations/association-scope.ts:1007` calls `item._isNamedJoinValue?.(v)`
- `relation/merger.ts:162` calls `other._isNamedJoinValue(v)`
- `relation/calculations.ts:177` declares `_applyJoinsToManager` on its host
  interface

Cluster total: ~600 lines with no Rails counterpart. Depends on the
`build_arel` convergence story, since `_applyJoinsToManager` is the caller.

Related prior art: RFC 0027 `join-dependency-fidelity` (all stories done) —
check its landed work before re-deriving; this story is the missing "and now
delete the parallel resolver" half.

## Acceptance criteria

- `joins(:assoc)` resolves through `JoinDependency` — the same path the eager
  loader uses — via `build_joins` / `select_association_list`
  (`query_methods.rb:1741`, `:1810`).
- All `_resolve*Join`, `_deriveForeignKey`, `_appendAssociationScope`,
  `_isAssociationName`, `_isNamedJoinValue`, `_whereChainReflection` are
  deleted from `relation.ts`.
- The three external readers (`associations/association-scope.ts:1007`,
  `relation/merger.ts:162`, `relation/calculations.ts:177`) are rewritten
  against the Rails-named surface, not re-pointed at a renamed helper.
- Generated SQL for `joins`, through-associations, HABTM, polymorphic and STI
  targets is unchanged: the `relation/*.test.ts` suites plus
  `relation/cpk-eager-count-aggregate-build-joins-fold.trails.test.ts` and
  `relation/build-joins-from-subquery-dedup.test.ts` pass unchanged, on all
  three adapters.
- `pnpm parity:api:calls` / `:args` clean; `parity:api` / `parity:test` deltas
  non-negative.
