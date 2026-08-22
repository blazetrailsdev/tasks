---
title: "Delete Arel::Nodes::CrossJoin — Rails has no such node"
status: ready
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `SelectManager`'s join variants in PR #6860
(`arel-select-manager-join-variants`). Retiring `SelectManager#crossJoin`
required a join class to pass to `join(relation, klass)`, and the only one
available was `Arel::Nodes::CrossJoin` — which **does not exist in Rails**.

`vendor/rails/activerecord/lib/arel/nodes/` defines `InnerJoin`,
`LeadingJoin`, `OuterJoin`, `RightOuterJoin`, `FullOuterJoin` and
`StringJoin`. There is no `cross_join.rb`, and
`grep -rn "CrossJoin" vendor/rails/activerecord/lib/arel/` returns nothing.

trails-only surface:

- `packages/arel/src/nodes/binary.ts:280` — `export class CrossJoin extends Join`
- `packages/arel/src/nodes/index.ts:56` — barrel re-export
- `packages/arel/src/visitors/to-sql.ts:400` — `reg(Nodes.CrossJoin, "visitCrossJoin")`
- `packages/arel/src/visitors/to-sql.ts:1763` — `visitCrossJoin`

Rails' `to_sql.rb` has no `visit_Arel_Nodes_CrossJoin`, so the visitor half is
invented too. After PR #6860 the only remaining callers are two assertions in
`packages/arel/src/select-manager.test.ts` (`crossJoin generates CROSS JOIN`);
there is no production caller in `packages/*/src`.

## Converged shape

Delete the node, its barrel export, its visitor registration and
`visitCrossJoin`, and drop the two trails-only tests that are its sole
remaining callers — no Rails test exercises a CROSS JOIN through Arel.

If a real caller turns up during the work, the Rails-shaped answer is a
`StringJoin` (Rails' own escape hatch for join SQL Arel has no node for,
`select_manager.rb:105-109`), not a resurrected node class.

## Acceptance criteria

- [ ] `Nodes.CrossJoin` and `visitCrossJoin` are gone; `grep -rn "CrossJoin" packages/` is empty.
- [ ] `pnpm parity:api:extra --package arel` — `nodes/binary.ts` and
      `visitors/to-sql.ts` each drop their `CrossJoin`/`visitCrossJoin` row.
- [ ] `pnpm vitest run packages/arel` green.
- [ ] No new `@noRailsEquivalent` tag.
