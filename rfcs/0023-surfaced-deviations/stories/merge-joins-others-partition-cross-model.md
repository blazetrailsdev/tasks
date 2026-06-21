---
title: "merge_joins threads raw others alongside cross-klass JoinDependency"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-21T03:02:43Z"
assignee: "merge-joins-others-partition-cross-model"
blocked-by: null
---

## Context

Surfaced in review of PR #3504 (left-joins-cross-model-merge). Rails
`Merger#merge_joins` (merger.rb:117-134) partitions the source relation's
`joins_values` into `associations` (Hash/Symbol/Array) and `others` (raw SQL
strings / Arel nodes), then calls `relation.joins!(join_dependency, *others)` —
threading `*others` alongside the cross-klass InnerJoin JoinDependency so raw
join clauses survive a cross-model merge.

trails `relation/merger.ts` `mergeJoins` passes all of `other._namedInnerJoins`
to `constructJoinDependency` and drops anything that is not an association name.
The sibling `mergeOuterJoins` is a no-op for this gap (the left-outer store only
ever holds association specs — `leftOuterJoins` forbids string args), so ONLY
the inner-join path needs the fix.

Rails ref: `activerecord/lib/active_record/relation/merger.rb:122-133`.

## Acceptance criteria

- [ ] Cross-model `merge` of a relation carrying raw SQL / Arel-node joins
      (the `others` partition) preserves those join clauses, matching Rails
      `relation.joins!(join_dependency, *others)`.
- [ ] Test mirrors a Rails cross-model merge that mixes an association join with
      a raw join clause; verify both survive.
