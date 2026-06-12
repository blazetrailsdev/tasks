---
title: "from(setOpRelation): route through live-AST once set-ops are Arel nodes; drop BoundSqlLiteral inlining fallback"
status: draft
updated: 2026-06-11
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: ["set-operations-arel-nodes", "from-clause-arel-manager"]
deps-rfc: []
est-loc: 120
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Relation#_buildFromNode` (`packages/activerecord/src/relation.ts` ~L4195) has
one remaining non-AST escape hatch, and its own doc comment marks it as the
deferred piece of this RFC: when the `from()` value is a relation with
`_setOperation` set, there is "no AST representation in trails (`_toSql`
string-concatenates the operands)", so it compiles the subquery to a string,
regex-rewrites PG `$N` placeholders to positional `?`
(`subSql.replace(/\$\d+/g, "?")`), and wraps the whole thing in a
`Nodes.BoundSqlLiteral` with the side-channel `_lastSelectBinds`.

[[set-operations-arel-nodes]] gives set-op relations a real
`Nodes.Union`/`UnionAll`/`Intersect`/`Except` AST. Once that lands, this
fallback can die: a `from(setOpRelation)` becomes the same live
`opts.arel.as(name)` `TableAlias` subquery path every other `from(relation)`
takes (Rails `build_from`, `query_methods.rb` L1783 — Rails has no special
case because set-ops were never strings).

Work: delete the `raw instanceof Relation && raw._setOperation` branch and the
`BoundSqlLiteral`/placeholder-rewrite machinery; the generic `buildFrom()`
branch handles it. Update the `_buildFromNode` doc comment (it currently
documents the fallback). Check for the same fallback pattern anywhere else
`_setOperation` leaks (grep `_setOperation` in relation.ts; calculations and
pluck paths after [[calculations-from-arel-manager]]).

## Acceptance criteria

- [ ] No `BoundSqlLiteral` set-op fallback remains in `_buildFromNode`; a
      `from(a.union(b), "alias")` compiles through the visitor with
      collector-numbered binds (no `$N`→`?` regex).
- [ ] SQL matches Rails across adapters: parenthesized operands on PG/MySQL,
      SQLite `Grouping`-strip behavior (already in
      `arel/src/visitors/sqlite.ts`) — covered by ported tests, verified
      locally on SQLite + PG.
- [ ] Retryability/bind metadata flows from the child nodes (no
      `_lastSelectBinds` side-channel for this path).
- [ ] No test renames; `test:compare` delta ≥ 0; ≤500 LOC.
