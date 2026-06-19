---
title: "fix(activerecord): normalize Relation values in buildBoundSqlLiteral positional/named binds"
status: in-progress
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3628
claim: "2026-06-19T03:36:25Z"
assignee: "bound-sql-literal-relation-normalization"
blocked-by: null
---

## Context

`buildBoundSqlLiteral` (query-methods.ts:1659) and `buildWhereClause`'s named-bind path normalize Arel nodes and `idForDatabase` records before constructing `BoundSqlLiteral`, but do not handle Relation objects passed as positional or named bind values.

Rails' `build_bound_sql_literal` at query_methods.rb:1682-1697 maps Arel nodes through `Arel.arel_node?` and passes all other values through `ActiveModel::Attribute.with_cast_value`. Relation objects fall into the non-Arel branch in Rails (they respond to `to_sql` but are not Arel nodes).

In trails, `where("id IN (?)", SomeRelation)` passed as a positional bind hits `normalizeBoundValue` but is not recognized as either an Arel node or an `idForDatabase` record, so it passes through unchanged and `visitBindValue` tries to call `this.quote(relation)` on it.

Traced in PR #3598 (Codex review round 6).

## Acceptance criteria

- [ ] `normalizeBoundValue` detects Relation-like values (duck-type: `toArel()` or `toSql()` method) and converts them to `arelSql(value.toSql())`, matching Rails' Arel node path
- [ ] `where("id IN (?)", Topic.where(approved: true))` produces valid SQL (subquery)
- [ ] Named bind variant `where("id IN (:ids)", {ids: SomeRelation})` also normalizes correctly
- [ ] Existing bind-parameter and finder tests continue to pass
