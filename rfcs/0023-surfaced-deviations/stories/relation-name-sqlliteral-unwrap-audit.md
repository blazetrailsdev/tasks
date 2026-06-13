---
title: "Audit relation-name string consumers for SqlLiteral unwrap (SqlLiteral is not a String subclass)"
status: draft
updated: 2026-06-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during `from-setop-subquery-ast` (PR #3185). In Rails,
`Arel::Nodes::SqlLiteral < String` (`arel/nodes/sql_literal.rb:5`), so a
`TableAlias`/relation `name` that is a SqlLiteral is still a `String` and every
`relation.name` consumer works unchanged. trails models `SqlLiteral` as a
standalone `Node`, so widening `RelationLike.name` / `TableAlias.name` to
`string | SqlLiteral` (done in PR #3185 for set-op derived-table aliases) means
consumers that treat the name as a string must explicitly unwrap
(`x instanceof SqlLiteral ? x.value : x`).

PR #3185 fixed the known hot sites (`columnForAttribute`, both
`columnReferences` branches), but other `relation.name` / `RelationLike.name`
readers may still assume a plain string and silently mishandle a SqlLiteral name
(some are reached via `as any` casts that suppress the type error). The risk is
latent: a SqlLiteral object flowing into a `String`-typed slot (e.g.
`.toLowerCase()`, schema-cache keys, identifier quoting).

Work: audit all consumers of `RelationLike.name` / `TableAlias.name` (and
`as any` accesses of `.relation.name`) across activerecord + arel for missing
SqlLiteral unwraps; add unwraps or a shared coercion helper.

## Acceptance criteria

- [ ] All `RelationLike.name` / `TableAlias.name` string consumers handle a
      `SqlLiteral` name (unwrap to `.value`), with no `as any` masking the type.
- [ ] A regression test covers a TableAlias with a SqlLiteral name flowing
      through the audited paths.
