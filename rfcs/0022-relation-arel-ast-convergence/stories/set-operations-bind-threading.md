---
title: "Set-ops: thread binds through the collector; drop the $N regex renumber"
status: done
updated: 2026-06-12
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["set-operations-arel-nodes"]
deps-rfc: []
est-loc: 300
priority: 2
pr: 3149
claim: "2026-06-12T16:18:05Z"
assignee: "set-operations-bind-threading"
blocked-by: null
---

## Context

Follow-on to `set-operations-arel-nodes`. Today `_toSql` (relation.ts ~L3845–3856)
compiles each side independently — so both sides start their PG `$N` numbering at
`$1` — then **regex-renumbers** the right side to make the combined statement's
placeholders globally unique:

```ts
const rightSqlFinal =
  leftBinds.length > 0 && /\$\d+/.test(rightSql)
    ? rightSql.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n, 10) + leftBinds.length}`)
    : rightSql;
```

Once the set operation is a single `Nodes.Union*` AST (previous story), the whole
node can be visited in **one pass** with **one collector**, which numbers all
binds globally by construction — eliminating both the independent compile and the
regex renumber.

## Scope

- Compile the composed `Nodes.Union*` node through a single `SQLString` collector
  so `leftBinds` and `rightBinds` are gathered in document order and PG `$N`
  numbering is globally correct without post-processing.
- Delete the `rightSql.replace(/\$(\d+)/g, …)` renumbering and the per-side
  `_lastSelectBinds` concatenation in the `_setOperation` branch.
- Verify `_lastSelectBinds` ends up identical (same order/values) to today for
  the same query, so downstream consumers are unaffected.

## Rails source

- Rails relies entirely on the visitor + collector for bind ordering across
  compound SELECTs (no equivalent renumber step); arel `nodes/binary.rb` +
  `visitors/to_sql.rb` `visit_Arel_Nodes_Union*`.

## Test assertions

- PG: `union`/`unionAll`/`intersect`/`except` with **bound parameters on both
  sides** produce a single globally-numbered `$1..$N` statement and correct
  results.
- MySQL: `?` placeholders bind in left-then-right order.
- SQLite: unchanged (no numbered placeholders).

## Acceptance criteria

- [ ] The `$N` regex renumber and manual per-side bind concat are removed; binds
      flow through one collector.
- [ ] PG set-op tests with binds on both sides pass with globally-unique `$N`.
- [ ] `_lastSelectBinds` order/values match the pre-change output for the same
      query. No test renames.

## Notes

- Confirm `allowRetry = false` (relation.ts L2280) still holds for set ops.
