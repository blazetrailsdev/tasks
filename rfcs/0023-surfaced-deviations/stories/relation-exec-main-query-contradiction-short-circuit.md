---
title: "Relation#exec_main_query should short-circuit contradiction where-clause to [] without executing"
status: in-progress
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: 40
pr: 3883
claim: "2026-06-22T13:23:57Z"
assignee: "relation-exec-main-query-contradiction-short-circuit"
blocked-by: null
---

## Context

Rails `Relation#exec_main_query` short-circuits a contradictory where-clause
_before_ issuing any SQL:

    # activerecord/lib/active_record/relation.rb (exec_main_query)
    elsif where_clause.contradiction?
      [].freeze

So `Post.where(id: []).to_a` (and `.explain`) runs **no** query and returns
`[]`. trails' `_toArrayInner` (packages/activerecord/src/relation.ts) has no
contradiction short-circuit: it compiles `WHERE 1=0` and executes it, issuing a
real SELECT. This surfaced while porting `Relation#explain` to the
always-executing `exec_queries` path (PR #3845): a contradiction relation now
collects a `WHERE 1=0` query for EXPLAIN where Rails collects none.

This is distinct from `.none()` (`@none`), which trails already handles via
`_isNone`. The gap is the `where_clause.contradiction?` branch — an empty-`IN`
predicate produced by `where(col: [])`.

## Acceptance criteria

- [ ] `_toArrayInner` (or the shared exec path) short-circuits to `[]` when the
      where-clause is a contradiction, matching Rails `exec_main_query`, so no
      SELECT is issued.
- [ ] `Relation#explain` on a contradiction relation collects zero queries
      (yields empty output), mirroring `.none()`.
- [ ] Port the corresponding Rails coverage (contradiction returns `[]` with no
      query) on the canonical schema; test names match Rails verbatim.
