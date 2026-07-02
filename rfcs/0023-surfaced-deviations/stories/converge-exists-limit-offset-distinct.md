---
title: "converge-exists-limit-offset-distinct"
status: in-progress
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4427
claim: "2026-07-02T18:09:51Z"
assignee: "converge-exists-limit-offset-distinct"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by faithful-port-finder-exists-cluster. `Relation#exists?`
(packages/activerecord/src/relation.ts ~line 3600) builds its existence probe
as `SELECT 1 AS one FROM <table> LIMIT 1` and never applies the relation's
`limit`, `offset`, or `distinct` values. Rails'
`FinderMethods#construct_relation_for_exists` (finder_methods.rb) DOES honor
them: when `distinct_value && offset_value` it keeps distinct+offset (dropping
only order) and limits 1; otherwise it strips select/distinct/group/having.
`limit(0)` must short-circuit to `false` with no query at all.

These finder_test.rb ports are `it.skip`'d in finder.test.ts pending this fix:

- exists with distinct and offset and joins
- exists with distinct and offset and select
- exists with distinct and offset and eagerload and order
- exists with includes limit and empty result
- exists with distinct association includes and limit
- exists with distinct association includes limit and order

## Acceptance criteria

- [ ] `exists?` honors limit/offset/distinct per construct_relation_for_exists.
- [ ] `limit(0).exists?` returns false with zero queries.
- [ ] Un-skip the six tests above; they pass.
