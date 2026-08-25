---
title: "converge-merge-joins-helper-onto-joins-bang"
status: done
updated: 2026-08-01
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5766
claim: "2026-07-31T22:50:41Z"
assignee: "converge-merge-joins-helper-onto-joins-bang"
blocked-by: null
closed-reason: null
---

## Context

`port-build-join-buckets-eager-stash-pop` (RFC 0083, PR TBD) was specified to
DELETE three `joins!` / `left_outer_joins!` wide-exclude entries on the premise
that steps 1 and 2 of the split had made those calls real. Two of them are not:

- `scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/merger.json`
  — `merge_joins` / `joins!` and `merge_outer_joins` / `left_outer_joins!`.

(The third, `relation.json` `apply_join_dependency` / `joins!`, was already
deleted by #5747 — nothing left to do there.)

Rails ends the cross-model branch of `merge_joins` / `merge_outer_joins` with
`relation.joins!(join_dependency, *others)` /
`relation.left_outer_joins!(join_dependency, *others)`
(`vendor/rails/activerecord/lib/active_record/relation/merger.rb:117-152`).
trails' `Merger#mergeJoins` / `#mergeOuterJoins`
(`packages/activerecord/src/relation/merger.ts:96-102`) are thin wrappers over
`foldMergeJoins` / `foldMergeOuterJoins`
(`packages/activerecord/src/relation/merge-joins.ts:36-103`), which push
straight onto `target._joinsValues` / `target._leftOuterJoinsValues` with their
own `joinsUnionEq` dedup instead of going through `joinsBang` /
`leftOuterJoinsBang` (`relation/query-methods.ts:962-984`).

Deleting the two entries was tried and reverted: `pnpm parity:api:calls` reports
both as NEW mismatches, because the wide gate does not follow `merger.ts` into
`merge-joins.ts`. Their reasons were rewritten to record this real state instead
of the stale RFC 0047 baseline text.

## Acceptance criteria

- The cross-model branches of `foldMergeJoins` / `foldMergeOuterJoins` route
  their appends through `joinsBang` / `leftOuterJoinsBang` (Rails' `joins!`),
  dropping the duplicate structural-union loop, OR the helper split is collapsed
  back into `merger.ts` so the gate sees the call.
- The two `merger.json` entries are deleted and `pnpm parity:api --wide-calls`
  - `pnpm parity:api:calls` do not re-require them; ratchet
    `call-mismatches-wide-unreviewed.json` down if the unreviewed count drops.
- `relation/merging.test.ts` and the `joins` / `eagerLoad` relation tests pass
  unchanged (no test renames).
