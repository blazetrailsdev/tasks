---
title: "Relation#toSql via unprepared_statement { conn.to_sql(arel) } (drop the post-hoc substituteBoundValues inliner)"
status: claimed
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: set-ops
deps: ["audit-bind-inlining-rails-fidelity", "connection-tosql-via-collector"]
deps-rfc: []
est-loc: 120
priority: 4
pr: null
claim: "2026-06-15T11:45:09Z"
assignee: "relation-tosql-unprepared-statement"
blocked-by: null
---

## Context

> Reconciled against `main` by the audit (audit-bind-inlining-rails-fidelity).
> The `_lastSelectNode` / `_inlineBindQuoter` names came from the closed PR
> #3300 design and do **not** exist on `main`. The actual trails-ism is a
> post-hoc `substituteBoundValues` inliner.

**trails (`main`).** `Relation#toSql` (`packages/activerecord/src/relation.ts:4193`)
calls `this._toSql()` (:4630) to render placeholder SQL, then re-inlines the
binds with a post-hoc `Visitors.substituteBoundValues(sql, …)` pass
(`relation.ts:4202`) whose callback quotes each value via
`this._resolveAdapter().quote(val)` (with a hand-rolled `'…'`/NULL/`String(val)`
fallback when no adapter). The binds come from `_lastSelectBinds`, set in
`_compileSelectSql` (`relation.ts:4607`) via `compileWithBinds`.

**Rails (vendor/rails v8.0.2).** `Relation#to_sql` (`relation.rb:1210-1219`) is:

```ruby
model.with_connection do |conn|
  conn.unprepared_statement { conn.to_sql(arel) }
end
```

`unprepared_statement` forces `prepared_statements = false`, so `conn.to_sql`
compiles through the `SubstituteBinds` collector
(`abstract_adapter.rb:1176` → `database_statements.rb:12-58`) with the
connection as quoter. No cached node, no bespoke quoter, no post-hoc pass — the
values are inlined during AST traversal.

## Acceptance criteria

- `Relation#toSql` builds the arel (the same node `_toSql` compiles) and renders
  it via `connection.unpreparedStatement(() => connection.toSql(arel))` (sync
  scope per connection-tosql-via-collector), matching `relation.rb:1217-1218`.
- The post-hoc `substituteBoundValues` block at `relation.ts:4202` and its
  hand-rolled fallback quoter are deleted; execution paths keep using
  `_lastSelectBinds` from `compileWithBinds` as before.
- Eager-load and set-operation branches still produce identical SQL (set-op
  paren handling comes from the visitor, as in Rails).
- Depends on connection-tosql-via-collector landing first (so `connection.toSql`
  already inlines through `collector()` rather than `compileInlined`).
- No behavior change in existing snapshot output; api:compare and test:compare
  deltas non-negative.

Depends on: audit-bind-inlining-rails-fidelity, connection-tosql-via-collector.
