---
title: "WhereClause#toSql: route through the connection (or remove) — drop bespoke inspectQuoter"
status: ready
updated: 2026-06-14
rfc: "0022-relation-arel-ast-convergence"
cluster: verify
deps: ["audit-bind-inlining-rails-fidelity"]
deps-rfc: []
est-loc: 90
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`WhereClause#toSql` (`packages/activerecord/src/relation/where-clause.ts:122`)
renders through `Collectors.SubstituteBinds(inspectQuoter, …)`. `inspectQuoter`
is a bespoke `'…'`/NULL/`String(val)` renderer — NOT the connection's `quote` —
and the method uses a module-level `new Visitors.ToSql()` with no connection.

Rails' `ActiveRecord::Relation::WhereClause` has **no `to_sql` method**
(verified, v8.0.2 `relation/where_clause.rb`). The entire trails
`WhereClause#toSql` method plus `inspectQuoter` is a trails-ism. "Exactly how
Rails does it" = the method does not exist; callers must render predicate SQL
the Rails way (e.g. through the relation / `connection.toSql`).

## Acceptance criteria

- Per the audit, determine whether `WhereClause#toSql` should exist. If it should:
  route it through the connection (e.g. `connection.toSql` under
  `unpreparedStatement`, or pass the connection as the `SubstituteBinds` quoter)
  and delete `inspectQuoter`. If it should not: remove the method and migrate its
  callers to the Rails-equivalent rendering.
- All current callers of `WhereClause#toSql` (inventoried in the audit) produce
  identical output.
- No behavior change in existing snapshot output; api:compare and test:compare
  deltas non-negative. NEVER rename a test to make it pass.

Depends on: audit-bind-inlining-rails-fidelity.
