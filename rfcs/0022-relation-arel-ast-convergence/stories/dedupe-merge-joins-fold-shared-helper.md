---
title: "Extract shared join-folding helper so merge/merge! can't drift"
status: ready
updated: 2026-07-06
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 45
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4660 (merge-joins-preserve-single-array-order) converged the join-folding
logic in two places, but did so by **hand-duplicating** the same loop verbatim:

- `relation/merger.ts` `Merger#mergeJoins`
- `relation/spawn-methods.ts` `mergeBang` (the `merge!` field-by-field mirror)

Both now walk `other.joinsValues` in a single ordered pass and branch per value
(raw structural dedup vs same-klass named `structuralUnionEq` dedup vs cross-klass
named `constructJoinDependency.call(other, ..., Nodes.InnerJoin)` stash). The two
copies are byte-for-byte identical logic. The PR reviewer explicitly verified they
match today, but there is nothing enforcing they stay in sync — a future edit to
one path (e.g. a new join category or a dedup fix) can silently drift `merge` from
`merge!`, which is exactly the class of bug PR #4660 fixed.

## Acceptance criteria

- Extract the shared join-folding pass (raw / same-klass named / cross-klass named
  branching, plus the `_leftOuterJoinsValues` union and `_namedInnerJoinDeps` /
  `_leftOuterJoinDeps` carry-forward) into ONE helper consumed by both
  `Merger#mergeJoins` and `mergeBang`.
- No behavior change: same-klass ordered union, cross-klass JoinDependency stash,
  raw structural (`eql`/`===`) dedup all preserved.
- Existing merging.test.ts interleaved-order + cross-klass tests stay green for
  both `merge` and `mergeBang`; no test:compare regression.
