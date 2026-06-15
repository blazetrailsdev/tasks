---
title: "WhereClause#toSql: route through the connection (or remove) — drop bespoke inspectQuoter"
status: in-progress
updated: 2026-06-15
rfc: "0022-relation-arel-ast-convergence"
cluster: verify
deps: ["audit-bind-inlining-rails-fidelity"]
deps-rfc: []
est-loc: 90
priority: 5
pr: 3316
claim: "2026-06-15T02:16:27Z"
assignee: "whereclause-tosql-drop-inspectquoter"
blocked-by: null
---

## Context

> Reconciled against `main` by the audit. There is no named `inspectQuoter`
> symbol on `main` (that name came from the closed PR #3300 design); the
> bespoke quoter is the inline callback described below.

**trails (`main`).** `WhereClause#toSql`
(`packages/activerecord/src/relation/where-clause.ts:105`) recompiles the
predicate AST with a module-level `new Visitors.ToSql()` (no connection),
`compileWithBinds`, then re-inlines via a post-hoc
`Visitors.substituteBoundValues(sql, …)` (`where-clause.ts:113`) whose callback
is a bespoke `'…'`/NULL/`String(val)` renderer — NOT the connection's `quote`.
Its **only** production caller is `Relation#inspect` (`relation.ts:1201`),
rendering the `.where("…")` fragment of the query-chain string.

**Rails (vendor/rails v8.0.2).** `ActiveRecord::Relation::WhereClause`
(`relation/where_clause.rb`) has **no `to_sql` method** — its methods are
`+ - | merge except or to_h ast == …`. The entire trails `WhereClause#toSql`
method plus its inline quoter is a trails-ism; inlined where-SQL in Rails is
produced only via `Relation#to_sql` → `conn.to_sql(arel)`.

## Acceptance criteria

- Since Rails has no `WhereClause#to_sql`, route the rendering the Rails way:
  either remove the method and have `Relation#inspect` (`relation.ts:1201`)
  render its `.where(…)` fragment through `connection.toSql` under
  `unpreparedStatement`, or — if a `WhereClause`-local helper is kept for
  inspect — pass the connection as the `SubstituteBinds` quoter. Delete the
  bespoke inline quoter callback (`where-clause.ts:113`) and the module-level
  connection-less `new Visitors.ToSql()` either way.
- The single production caller, `Relation#inspect` (`relation.ts:1201`),
  produces identical `.where("…")` output.
- No behavior change in existing snapshot output; api:compare and test:compare
  deltas non-negative. NEVER rename a test to make it pass.

Depends on: audit-bind-inlining-rails-fidelity.
