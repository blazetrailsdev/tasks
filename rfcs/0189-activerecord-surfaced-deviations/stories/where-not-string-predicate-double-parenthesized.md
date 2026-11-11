---
title: "where.not on a SQL string emits NOT ((sql)) where Rails emits NOT (sql)"
status: draft
updated: 2026-11-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on trails#9978 (`relation-where-not-string-sql-overload`).

`Post.where().not("title = ?", "x").toSql()`, and the array form `where().not(["title = ?", "x"])`, both emit
`WHERE NOT ((title = 'x'))`. Rails emits `WHERE NOT (title = 'x')`
(documented at `vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:22-27`).

Rails' `WhereClause#invert_predicate`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/where_clause.rb:163-168`) inverts a
String predicate as `Arel::Nodes::Not.new(Arel::Nodes::SqlLiteral.new(node))`, i.e. a `Not` over a
bare literal, and the visitor's `NOT (…)` supplies the only parentheses. `wrap_sql_literal`
(`:187-192`) adds a `Grouping` only on the non-inverted `ast` path. The trails port seems to reach
`invert` with the literal already grouped, or to group it in `invertPredicate`, so the visitor's
parentheses double up.

## Acceptance criteria

- `where().not("title = ?", "x")` and `where().not(["title = ?", "x"])` emit `NOT (title = 'x')`.
- `invertPredicate`'s String arm is `new Nodes.Not(new Nodes.SqlLiteral(node))`, line for line with `where_clause.rb:167-168`, and the Grouping comes only from `wrapSqlLiteral` on the `ast` path.
- `relation/where-chain.trails.test.ts`'s "not with a bare SQL string and binds" asserts the exact `NOT (title = 'x')` SQL.
