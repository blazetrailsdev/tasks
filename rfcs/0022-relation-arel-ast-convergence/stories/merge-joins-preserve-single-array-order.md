---
title: "Preserve joins_values single-array order across .merge (no raw-then-named reorder)"
status: in-progress
updated: 2026-07-06
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4660
claim: "2026-07-06T04:06:20Z"
assignee: "merge-joins-preserve-single-array-order"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4645 (unify-join-values-storage-faithful-accessor).
Now that `joins_values` is a single insertion-ordered `_joinsValues` store, the
`.merge` join-folding paths still combine the other relation's joins in
**raw-then-named** category order rather than preserving the other relation's
original single-array order:

- `relation/spawn-methods.ts` `mergeBang`: pushes `other._joinValues` (raw)
  into `this._joinsValues`, THEN loops `other._namedInnerJoins` (named). A source
  relation whose joins interleave named/raw (e.g. `joins(:a, "RAW", :b)`) folds
  in as `[RAW, a, b]`, not `[a, RAW, b]`.
- `relation/merger.ts` `mergeJoins`: same shape — `otherRawJoins` loop then
  `otherNamed` loop, both writing `rel._joinsValues`.

Rails merges with `relation.joins_values |= other.joins_values`
(activerecord `relation/merger.rb` `merge_joins`) — a single ordered array
union that preserves the other relation's exact insertion order across the
named/raw boundary. This is a pre-existing deviation (not introduced by #4645;
the reviewer explicitly noted it as out of that PR's scope), but the unified
store now makes a faithful single-pass merge straightforward: iterate
`other.joinsValues` once and union each entry into `this._joinsValues` with
`structuralUnionEq`, applying the raw-append vs named-dedup rule per entry.

## Acceptance criteria

- `mergeBang` and `mergeJoins` fold the other relation's `joinsValues` in a
  single ordered pass so a merged relation's `joinsValues` preserves the source's
  cross-category insertion order (union semantics matching `merge_joins`' `|=`).
- Preserve existing dedup: raw joins union structurally, named specs dedup by
  `structuralUnionEq`; cross-klass named still build a JoinDependency stash.
- Add a merging test asserting interleaved named/raw join order survives `.merge`.
- No test:compare regression; `relation/merger.rb` stays 100% api:compare.
