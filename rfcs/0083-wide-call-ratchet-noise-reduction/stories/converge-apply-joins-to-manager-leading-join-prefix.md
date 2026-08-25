---
title: "Shift only the leading run of raw join nodes on the live build_joins half"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps:
  - converge-apply-joins-to-manager-raw-join-routing
deps-rfc: []
est-loc: 120
priority: 0
pr: 5902
claim: "2026-08-02T18:43:24Z"
assignee: "converge-apply-joins-to-manager-leading-join-prefix"
blocked-by: null
closed-reason: null
---

## Context

Found while porting the leading-join loop in `buildJoinBuckets` (#5765).

Rails routes raw join values positionally: `while joins.first.is_a?(
Arel::Nodes::Join)` (`vendor/rails/activerecord/lib/active_record/relation/
query_methods.rb:1855-1862`) shifts only the LEADING run of Join nodes off
`joins` and routes those by `stashed_eager_load || stashed_left_joins`. A Join
node sitting BEHIND a named join is never reached by that loop — it stays in the
array and falls to the `select_named_joins` block, which pushes it into
`buckets[:join_node]` UNCONDITIONALLY (`query_methods.rb:1866-1867`), i.e.
appended after the association joins regardless of the stash guard.

PR #5765 ported that into the subquery half (`buildJoinBuckets`,
`packages/activerecord/src/relation/query-methods.ts`). The live half did not
change: `Relation#_applyJoinsToManager`
(`packages/activerecord/src/relation.ts`, the `for (const v of this._joinValues)`
loop) still pulls EVERY raw join value out of the store regardless of position
and runs the single `hasStashed`-gated branch over all of them. Position is
therefore invisible on the live path: a raw join written before a named join and
one written after it are treated identically.

This is a separate axis from
`converge-apply-joins-to-manager-raw-join-routing`, which is about the
`hasStashed` PREDICATE on the live path (it wrongly ORs in
`_namedInnerJoins.length > 0` and friends). This story is about the positional
prefix semantics; both must land for the live half to match
`query_methods.rb:1855-1873`, and they touch the same loop, so they may be worth
sequencing together.

Ordering is load-bearing: a raw `JOIN` / `LEFT JOIN` fragment referencing a
table the association joins also touch resolves differently depending on which
side of the association joins it lands on.

## Acceptance criteria

- `_applyJoinsToManager` shifts only the leading run of `Nodes.Join` values off
  a single dup'd joins array, per `query_methods.rb:1855-1862`, instead of
  filtering the whole store.
- Raw join values that trail a named join are bucketed as join nodes
  unconditionally, per `query_methods.rb:1866-1867` — reusing
  `selectInnerNamedJoins` (`relation/query-methods.ts`), which already has the
  `Nodes.Join` branch.
- A regression test asserts the live path and the `from(subquery)` path emit the
  same join ORDER for `Post.joins("comments").joins("CROSS JOIN categories")`
  and for the reversed spelling; verified to fail on the pre-fix implementation.
- Ported `joins` / `eagerLoad` / `merge` relation tests pass unchanged (no test
  renames).
