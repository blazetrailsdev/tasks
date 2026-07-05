---
title: "Eager from() subquery emits plain star select, not Rails column-alias projection"
status: ready
updated: 2026-07-05
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/relation/query-methods.ts` `buildFrom` (eager branch, PR #4630) resolves an eager-loading `from(relation)` via `applyJoinDependencyForArel`, which clears the eager associations and adds `leftOuterJoins`, then builds `SELECT "comments".* FROM "comments" LEFT OUTER JOIN "posts" ...`.

Rails `build_from` (`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1789`) instead wraps `opts.arel` after `apply_join_dependency`, which via `JoinDependency#apply_column_aliases` produces the full aliased projection (`comments.id AS t0_r0, ... posts.id AS t1_r0, ...`). See the SUBSQL vs FROMSQL divergence captured in PR #4630.

Results are equal for the ported tests (outer `SELECT *`/`SELECT a.*` over a `comments.*` subquery instantiates correctly), so this is a SQL-shape deviation, not a correctness bug. The trails approach matches the where-subquery path (`relation-handler.ts`).

## Acceptance criteria

- Decide whether to converge the eager `from()` subquery onto Rails' column-alias projection (`opts.arel` shape) or document the plain-star shape as an intentional, shared deviation with the where-subquery path.
- If converging: eager `Comment.select("*").from(Comment.includes("post").where({"posts.type":"Post"}))` subquery emits the `t0_r*`/`t1_r*` aliased column list and still returns correct results on sqlite/postgres/mysql.
- Keep both `finding with subquery with eager loading in {from,where}` tests green.
