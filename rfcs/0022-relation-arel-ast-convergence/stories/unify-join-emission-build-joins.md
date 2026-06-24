---
title: "Unify the two build_joins ports (_applyJoinsToManager + buildJoins) into one shared emitter"
status: claimed
updated: 2026-06-24
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: null
claim: "2026-06-24T17:38:43Z"
assignee: "unify-join-emission-build-joins"
blocked-by: null
---

## Context

trails has **two** hand-synced implementations of Rails' single `build_joins`
(`active_record/relation/query_methods.rb:1881`):

- `_applyJoinsToManager` (`packages/activerecord/src/relation.ts:3242`) — the
  live `toSql`/`toArel` SQL path.
- `buildJoins` → `buildJoinBuckets`
  (`packages/activerecord/src/relation/query-methods.ts:2628`/:2556) — the
  `from(relation)` subquery path (`build_from` → `resolved.buildArel()` at
  query-methods.ts:2263).

They must be kept behaviorally identical by hand. They drifted: the
`buildJoins` path missed the left_outer/joins dedup fix PR #3501 made on the
live path, so `joins(:posts).left_outer_joins(:posts)` through a from-subquery
emitted both an INNER and a LEFT OUTER JOIN. PR #3890 re-converged `buildJoins`
(folding the left-outer JD into the inner JD's `joinConstraints`, aligning the
shared AliasTracker seeding), but the **duplication itself remains** — the next
join-emission change still has to touch both sites or risk re-drifting.

RFC 0022's `relation-arel-build-arel-convergence` (PR 3186, done) framed
"delete the duplicated assembly" as the goal but left the two join emitters
in place.

## Work

Extract the join-emission logic into a single shared helper that both
`_applyJoinsToManager` and `buildJoins` call (both operate on an
`Arel::SelectManager`), so there is one Rails `build_joins` port. Mind the two
differences that currently exist between the paths: eager-load handling
(`_applyJoinsToManager` relies on `_buildEagerJoinManager` running first /
`manager.joinSourceCount`, while `buildJoins` folds eager via
`buildJoinBuckets`'s stashed bucket), and the always-`undefined` `aliases`
parameter threaded into `buildArel`/`buildJoins`.

## Acceptance criteria

- [ ] Single shared join-emission implementation; `_applyJoinsToManager` and
      `buildJoins` both delegate to it (no second hand-maintained copy).
- [ ] `build_join_buckets` stays matched in `api:compare` (do not drop it).
- [ ] Add a from-subquery dedup test: `from(Model.joins(:x).left_outer_joins(:x))`
      emits a single INNER JOIN (the regression class PR #3890 fixed has no
      direct coverage today).
- [ ] api:compare and test:compare deltas non-negative.
