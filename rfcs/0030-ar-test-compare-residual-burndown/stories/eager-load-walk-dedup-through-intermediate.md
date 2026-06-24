---
title: "Walk-dedup through-association intermediate join table against eager spec"
status: in-progress
updated: 2026-06-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 4088
claim: "2026-06-24T23:22:33Z"
assignee: "eager-load-walk-dedup-through-intermediate"
blocked-by: null
---

## Context

PR #4008 (story `eager-load-joins-walk-dedup-nested-hash`) implemented a
recursive parallel walk of the eager-load and manual-`joins` spec forests
(`_walkSharedManualEagerTables`/`_collectSharedTables`, relation.ts:~2785),
mirroring Rails `JoinDependency#walk` (join_dependency.rb:214-219) so a nested
or hash-form manual join (`joins(posts: :comments)`) dedups against
`eager_load(posts: :comments)` at every level.

The walk dedups by **target table only**: `_assocTargetModel` resolves each
association NAME to its final target model/table and `_collectSharedTables`
adds that one table to the deduped-skip set. For a **through association**
(`has_many :comments, through: :posts`), the eager JoinDependency constructs
BOTH the intermediate join table (`posts`) AND the target (`comments`), and a
coinciding manual `joins(:commentsThroughPosts)` emits the same two joins —
but the walk only marks `comments` (the target) as deduped, not the
intermediate `posts`. Rails' `walk` dedups the full reflection chain, including
the through-intermediate.

In trails this does NOT crash: `_addEagerSpecsToJoinDependency` seeds the
manual-join tables that are NOT in the deduped set, so the eager intermediate
join aliases (`posts_authors`) instead of colliding — a valid but EXTRA join
rather than Rails' single deduped intermediate join. This is a fidelity
deviation (extra aliased intermediate join), narrower than the now-done
single-alias-tracker story `unify-alias-tracker-across-join-buckets` (#3552).

## Acceptance criteria

- [ ] `Model.joins(:throughAssoc).eager_load(:throughAssoc)` (and the nested
      hash form) dedups the through-INTERMEDIATE join table too, not just the
      final target — matching Rails `walk`'s full-chain reflection dedup.
- [ ] `_collectSharedTables`/`_assocTargetModel` walk the through chain
      (intermediate reflection → target) so each shared level's table enters the
      deduped-skip set; no extra aliased intermediate join.
- [ ] Add a canonical test (e.g. Author has_many comments through posts) and do
      not regress the string/dotted/hash dedup from #3990 / #4008.

## Notes

Start point: relation.ts `_assocTargetModel` currently returns only the final
target `{table, klass}`; through resolution lives in `_resolveThroughJoin`
(relation.ts:~1908). Consider yielding the intermediate table(s) for through
reflections during the walk.
