---
title: "converge-apply-joins-to-manager-drop-eager-jd-param"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5748
claim: "2026-07-31T20:13:10Z"
assignee: "converge-apply-joins-to-manager-drop-eager-jd-param"
blocked-by: null
closed-reason: null
---

## Context

Continuation of `converge-apply-join-dependency-joins-bang` (RFC 0083), which
converged `applyJoinDependency`
(`packages/activerecord/src/relation.ts:4846`) to Rails'
`except(:includes, :eager_load, :preload).joins!(construct_join_dependency(...))`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:457-461`)
and dropped the inline eager-JD construction from `buildJoinBuckets`
(`packages/activerecord/src/relation/query-methods.ts`).

The third compensating mechanism named in that story's scope was NOT retired:
the eager JoinDependency still reaches the live SQL path as a side-channel
parameter, `_applyJoinsToManager(manager, eagerJd, aliases)`
(`relation.ts:3256`), rather than riding in `joins_values` like Rails. The
parameter drives three trails-only clauses in that method — the `hasStashed`
`eagerJd !== undefined` term, the `pureLeftOuter` `eagerJd === undefined` term,
and the `if (eagerJd) stashedJoins.push(eagerJd)` fold — none of which have a
`build_join_buckets` analogue.

An attempt to route it through a `joins!`-carrying clone was reverted: the
parameter has ~10 further call sites in
`packages/activerecord/src/relation/calculations.ts` (lines 452, 552, 696, 848,
888, 913, 951, 989, 1011, 1026) plus the host-interface declaration at
`calculations.ts:101`, and the silent arity change there broke
`UpdateAllTest > update all with includes`
(`relation/update-all.test.ts`) — `makeEagerJd()` was consumed as the `aliases`
argument. Converging it needs all call sites moved together.

## Acceptance criteria

- `_applyJoinsToManager` loses its `eagerJd` parameter; the eager JoinDependency
  reaches it in `joins_values` (via `joins!`) and flows into `stashedJoins`
  through `emitJoinPlan`'s `select_named_joins` partition, as in Rails.
- The three `eagerJd` clauses in `_applyJoinsToManager` are removed.
- `calculations.ts`'s eager call sites (and the `QueryMethodsHost`-side
  declaration) are updated in the same change; `relation/update-all.test.ts`,
  `calculations.test.ts`, `associations/eager.test.ts` and
  `relation/cpk-eager-count-aggregate-build-joins-fold.trails.test.ts` pass
  unchanged (no test renames).
- If this exceeds 500 LOC, split rather than shipping a partial merge.
