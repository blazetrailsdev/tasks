---
title: "arel: signatures take the arel_node? union (Node | Attribute | SqlLiteral) (~500 LOC, types only)"
status: in-progress
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: trails#8400
claim: "2026-10-02T14:21:55Z"
assignee: "arel-signatures-take-the-arel-node-union"
blocked-by: null
closed-reason: null
---

## Context

`arel-attribute-and-sql-literal-are-not-nodes` takes `Arel::Attributes::Attribute`
(`vendor/rails/v8.0.2/activerecord/lib/arel/attributes/attribute.rb:5`,
`< Struct.new :relation, :name`) and `Arel::Nodes::SqlLiteral`
(`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/sql_literal.rb:5`, `< String`)
off the `Node` superclass. It was attempted in trails PR 8370's session and
released: swapping both superclasses produces 778 `tsc` errors, and clearing
them is a signature change in roughly 60 arel files and 250 `Nodes.Node` type
sites in activerecord — over 1,200 LOC with the swap itself. The swap is small;
the widening is the bulk, and it is behaviour-neutral, so it ships first, on
its own.

`Arel.arel_node?` (`vendor/rails/v8.0.2/activerecord/lib/arel.rb:64-66`) names
the union: `Arel::Nodes::Node`, `Arel::Attribute`, `Arel::Nodes::SqlLiteral`.
`arelNode` (`packages/arel/src/arel.ts`) already tests all three. The type
side is missing: every arel signature spells the accepted value `Node`, which
only works because the two classes extend it.

Measured order of attack (errors left after each step, from 778):

- `NodeOrValue` (`packages/arel/src/nodes/binary.ts`) gains the union, and
  `SelectManager`'s `project` / `order` / `group` / `from` / `join` / `having` /
  `where` / `on` / `lock` / `distinctOn` take it: 490.
- The statement nodes' fields (`select-core.ts`, `select-statement.ts`,
  `insert-statement.ts`, `update-statement.ts`, `delete-statement.ts`),
  `TreeManager` / `StatementMethods`, `Crud`, `FactoryMethods`, `Table`'s
  query methods, and the `Unary` / `Nary` / `Function` / `Case` / `Extract` /
  `HomogeneousIn` / `JoinSource` / `Join` / `Window` / `Fragments` /
  `UnaryOperation` / `Cte` / `TableAlias` constructors and fields: 275.
- `visitors/to-sql.ts`'s helpers (`compile`, `quoteTableName`,
  `quoteColumnName`, `maybeVisit`, `hasJoinSources`, `injectJoin`,
  `prepareUpdateStatement` / `prepareDeleteStatement`, `subselectKey`), and
  `UpdateManager` / `DeleteManager` / `InsertManager`: 188, all of them in
  activerecord and in tests (`activerecord-signatures-take-the-arel-node-union`).

`Nary#fetchAttribute` calls `child.fetch_attribute`
(`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/nary.rb`) on each child with
no guard; an `Attribute` child has no such method in Rails either, so that
call keeps a `Node` cast rather than a guard.

## Acceptance criteria

- [ ] `packages/arel/src/arel.ts` exports a type for the `arel_node?` union
      (`Node | Attribute | SqlLiteral`), `arelNode` is a type guard for it, and
      the package index exports the type.
- [ ] Every arel signature and field that accepts an `Attribute` or a
      `SqlLiteral` as a `Node` takes the union: with both classes' `extends Node`
      removed locally, `pnpm typecheck` reports no error under
      `packages/arel/src` outside the two class files.
- [ ] No runtime change: `Attribute` and `SqlLiteral` still extend `Node` when
      this merges. `pnpm vitest run packages/arel` and
      `pnpm parity:api:extra:gate` green.
