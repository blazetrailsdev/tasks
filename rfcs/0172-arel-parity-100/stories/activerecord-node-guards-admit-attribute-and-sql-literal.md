---
title: "activerecord: instanceof Node guards admit an Attribute and a SqlLiteral"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps:
  - arel-attribute-and-sql-literal-are-not-nodes
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while landing `activerecord-signatures-take-the-arel-node-union` (trails#8405). That PR widened activerecord's signatures to the `arel_node?` union and converged the sites where Rails itself calls `Arel.arel_node?` (`disallow_raw_sql!`, `_substitute_values`, the grouped-calculation aliases, `build_where_clause`'s String arm, `invert_predicate`). These guards were left: each tests `instanceof Nodes.Node` on a value that can be an `Arel::Attributes::Attribute` or an `Arel::Nodes::SqlLiteral`, so each changes behaviour the moment `arel-attribute-and-sql-literal-are-not-nodes` takes the two classes off `Node`. That story's third criterion names the class of site; this is the activerecord list, with the Rails shape for each.

- `packages/activerecord/src/relation/calculations.ts` `aggregateColumn` — `if (columnName instanceof Nodes.Node) return columnName`. Rails tests `when Arel::Expressions` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:414-423`). `Attribute` and `SqlLiteral` include `Arel::Expressions`; a bare `Node` does not. After the swap an `Attribute` would fall to `arel_column(String(attr))`.
- `packages/activerecord/src/relation/query-methods.ts` `reselectBang` and `_selectBang` — `if (c instanceof Nodes.Node) return c`, else `String(c)`. Rails assigns the arguments untouched (`relation/query_methods.rb:428-431`, `:548-551`). After the swap a `SqlLiteral` or an `Attribute` in `select` is stringified. `references-and-select-values-union-through-array-or` covers the union half of `_select!`; the normalising map is this story's.
- `query-methods.ts` `buildOrder`'s Hash arm — `key instanceof Nodes.Node ? orderedNode(key, value) : ...`. Rails: `relation/query_methods.rb` `preprocess_order_args` / `build_order`, `when Hash` maps each key through `order_column(field.to_s)` unless it is an arel node.
- `query-methods.ts` `arelColumnsFromHash` — `attr instanceof Nodes.Node ? attr : Arel.sql(String(col))`.
- `packages/activerecord/src/relation/finder-methods.ts` `exists?`'s conditions arm — `conditions instanceof Nodes.Node`.
- `packages/activerecord/src/base.ts` `where` — the `instanceof Nodes.Node` arm after the String arm.
- `packages/activerecord/src/relation.ts` `tablesInString` — `string instanceof Nodes.Node` then `.toSql()`. Rails takes a String only (`relation.rb:1491-1496`), and its one caller passes `join.left` of a `StringJoin`.
- `packages/activerecord/src/relation/where-clause.ts` — `left.expr instanceof Nodes.Node` in `or`, and `isEqualityNode`'s `(node as any).isEquality` probe.
- `packages/activerecord/src/relation/predicate-builder.ts` `groupingQueries` — `(left as Nodes.Node).and(right)`. Rails is `query.reduce(&:and)` (`relation/predicate_builder.rb:153-161`); the cast is honest only while every element is a `Node`.

How to find any that are missing from this list: remove `extends Node` from `packages/arel/src/attributes/attribute.ts` and `packages/arel/src/nodes/sql-literal.ts` locally. `tsc --build` is already clean in that state, so the remaining sites are runtime-only; run the AR test files that pass an `Attribute` or `Arel.sql(...)` to `select`, `order`, `group`, `count`, `sum`, `pluck`, `where`, `exists?`.

## Acceptance criteria

- [ ] Each site above tests what its Rails body tests: `Arel::Expressions` for `aggregate_column`, `Arel.arel_node?` (`arelNode`) where Rails calls it, and no guard where Rails has none (`reselect!`, `_select!`).
- [ ] With both classes' `extends Node` removed locally, `calculations.test.ts`, `relations.test.ts`, `finder.test.ts`, `unsafe-raw-sql.test.ts`, `relation/where-clause.test.ts` and `relation/order.test.ts` pass on SQLite.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` green.
