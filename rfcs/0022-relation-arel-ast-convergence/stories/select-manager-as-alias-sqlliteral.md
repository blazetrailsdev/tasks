---
title: "SelectManager#as: model alias as SqlLiteral; drop TableAlias Grouping-shape heuristic"
status: draft
updated: 2026-06-13
rfc: "0022-relation-arel-ast-convergence"
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

Surfaced during `from-setop-subquery-ast` (PR #3185). Rails'
`Arel::SelectManager#as` stores the alias as `Nodes::SqlLiteral.new(other,
retryable: true)` (`arel/select_manager.rb:48-50`), and
`visit_Arel_Nodes_TableAlias` renders it via `quote_table_name(o.name)`, which
returns SqlLiterals unchanged (`arel/visitors/to_sql.rb:425-428`). The bare
subquery alias is therefore **value-based** (the name is a literal), not
shape-based.

trails' `SelectManager#as` instead passes a plain `string` name and the
`visitArelNodesTableAlias` visitor decides bare-vs-quoted by checking
`node.relation instanceof Nodes.Grouping` — a legacy shape heuristic. PR #3185
added value-based rendering for the set-op `from()` path (alias modeled as a
`SqlLiteral`) but had to keep the Grouping-shape branch for back-compat with
`as()`.

Work: make `SelectManager#as` wrap the alias in a `SqlLiteral` (mirroring Rails),
then drop the `node.relation instanceof Nodes.Grouping` branch from
`visitArelNodesTableAlias` so the visitor renders purely on the name value
(`quoteTableName` already returns a SqlLiteral's value unchanged). Audit all
`TableAlias` constructions that pass a plain string and expect a bare alias.

## Acceptance criteria

- [ ] `SelectManager#as(name)` stores the alias as a `Nodes.SqlLiteral`.
- [ ] `visitArelNodesTableAlias` renders bare-vs-quoted purely from `node.name`
      (no `instanceof Nodes.Grouping` relation-shape check).
- [ ] Existing subquery-alias SQL (bare for `as()`, quoted for `Table#alias`)
      is unchanged; `test:compare` delta >= 0.
