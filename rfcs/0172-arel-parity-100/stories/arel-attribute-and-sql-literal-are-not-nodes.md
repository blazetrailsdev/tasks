---
title: "arel-attribute-and-sql-literal-are-not-nodes"
status: draft
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Arel::Attributes::Attribute < Struct.new :relation, :name`
(`vendor/rails/v8.0.2/activerecord/lib/arel/attributes/attribute.rb:5`) and
`Arel::Nodes::SqlLiteral < String`
(`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/sql_literal.rb:5`) are NOT
`Arel::Nodes::Node`s — which is why `Arel.arel_node?`
(`vendor/rails/v8.0.2/activerecord/lib/arel.rb:64-66`) tests all three classes.
trails' `Attribute` (`packages/arel/src/attributes/attribute.ts`) and
`SqlLiteral` (`packages/arel/src/nodes/sql-literal.ts`) both `extends Node`, so
they carry `Node#not` / `#or` / `#and` / `#invert` / `#toSql` / `#fetchAttribute` /
`#isEquality` / `#dup` and `FactoryMethods`, none of which Rails gives them.

`arel-struct-and-string-protocol-from-ruby-compat` gave them their Struct /
String protocol from ruby-compat (`Struct.new(...)`, `stringSuperclass(...)`),
but had to `include()` it rather than inherit it, because the `Node` superclass
stays. Measured there: swapping `Attribute`'s superclass off `Node` produces
434 `tsc` errors, almost all signatures typed `Node` that receive an
`Attribute` (tests, `select-manager`, `visitors/to-sql`, `activerecord/src/relation.ts`,
`calculations.test.ts`).

## Acceptance criteria

- [ ] `Attribute` no longer extends `Node`; its superclass is the `Struct.new("relation", "name")` class from ruby-compat, and every signature that accepted it as a `Node` takes the union Rails' `arel_node?` names.
- [ ] `SqlLiteral` no longer extends `Node`, and gets its String methods from the ruby-compat String port as its superclass.
- [ ] Every `instanceof Node` site that must also admit these classes mirrors `Arel.arel_node?`.
- [ ] `pnpm vitest run packages/arel`, the AR suite in CI, and `pnpm parity:api:extra:gate` green.
