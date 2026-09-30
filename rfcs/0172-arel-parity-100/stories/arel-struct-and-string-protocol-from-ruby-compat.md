---
title: "arel: inherit Attribute's Struct and SqlLiteral's String protocol from ruby-compat"
status: draft
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: receipts
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `arel-audit-permanent-receipts-against-claude-md`. Two arel classes
inherit their value protocol from a Ruby core class that JS cannot extend:

- `Arel::Attributes::Attribute < Struct.new :relation, :name`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/attributes/attribute.rb:5`), so
  `hash` / `eql?` / `==` are `Struct#hash` / `Struct#eql?`. trails defines
  `hash()` at `packages/arel/src/attributes/attribute.ts:49` (receipted) and
  `eql()` beside it (scored as moved).
- `Arel::Nodes::SqlLiteral < String`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/sql_literal.rb:5`), so
  `eql?` / `hash` are `String#eql?` / `String#hash` and `blank?` is
  ActiveSupport's `String#blank?`. trails defines `eql()` / `hash()` /
  `isBlank()` at `packages/arel/src/nodes/sql-literal.ts:22,28,41`.

No CLAUDE.md section ratifies these; § "Ruby protocol methods" only says `hash`
/ `eql?` are live and scored by name, which is why a definition in a file whose
`.rb` does not define them is extra surface. The converged shape inherits them
from ruby-compat, where Ruby-core surface is inventory (`@noRailsEquivalent
PERMANENT` there): a `Struct.new(...)`-style base for `Attribute`, and a
String-protocol base or mixin for `SqlLiteral`.

## Acceptance criteria

- [ ] `Attribute` gets `hash` / `eql` from a ruby-compat `Struct` port and
      `SqlLiteral` gets `eql` / `hash` / `isBlank` from a ruby-compat String
      protocol, with the four arel definitions and their receipts deleted.
- [ ] `rbHash` / `rbEqual` behaviour over both classes is unchanged
      (`pnpm vitest run packages/arel`).
- [ ] `pnpm parity:api:extra:gate` green.
