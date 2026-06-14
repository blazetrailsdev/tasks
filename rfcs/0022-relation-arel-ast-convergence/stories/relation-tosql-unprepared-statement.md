---
title: "Relation#toSql via unprepared_statement { conn.to_sql(arel) } (drop _lastSelectNode/_inlineBindQuoter)"
status: draft
updated: 2026-06-14
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["audit-bind-inlining-rails-fidelity", "connection-tosql-via-collector"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Relation#toSql` (`packages/activerecord/src/relation.ts:4167`) was converted in
PR #3300 to re-render the cached `_lastSelectNode` through a `SubstituteBinds`
collector with a bespoke `_inlineBindQuoter`. That removed the regex but kept two
trails-isms:

- `_lastSelectNode` bookkeeping (set in `_compileSelectSql` and
  `_toSqlSetOperation`) so `toSql()` can recompile the node.
- `_inlineBindQuoter` (`relation.ts`), a hand-rolled quoter with a no-connection
  fallback, instead of the connection.

Rails' `Relation#to_sql` is simply:

```ruby
conn = connection
conn.unprepared_statement { conn.to_sql(arel) }
```

`unprepared_statement` forces `prepared_statements = false`, so `conn.to_sql`
compiles through the `SubstituteBinds` collector with the connection as quoter.
No cached node, no bespoke quoter, no paren bookkeeping beyond what the visitor
emits.

## Acceptance criteria

- `Relation#toSql` builds the arel (the same node `_toSql` compiles) and renders
  it via `connection.unpreparedStatement(() => connection.toSql(arel))` (sync
  scope per the connection-tosql-via-collector story), matching Rails.
- `_lastSelectNode` and `_inlineBindQuoter` are deleted; the execution paths keep
  using `_lastSelectBinds` from `compileWithBinds` as before.
- Eager-load and set-operation branches still produce identical SQL (set-op paren
  handling comes from the visitor, as Rails).
- No behavior change in existing snapshot output; api:compare and test:compare
  deltas non-negative.

Depends on: audit-bind-inlining-rails-fidelity, connection-tosql-via-collector.
