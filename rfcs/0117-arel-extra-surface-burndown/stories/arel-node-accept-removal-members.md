---
title: "Delete per-node accept from the remaining nodes and retire NodeVisitor"
status: ready
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: ["arel"]
deps: ["arel-node-accept-removal-leaves"]
deps-rfc: []
est-loc: 220
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Companion to `arel-node-accept-removal-leaves`; read that story's Context for
the Rails citations (`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:10`
is one of only two `def accept` in all of arel; nodes have none).

This story finishes the removal on the files where `accept` sits **beside
other members**, deletes the abstract declaration, and retires the type.

## Scope — this story

- `packages/arel/src/nodes/node.ts:26` — delete `abstract accept<T>(visitor)`.
- `packages/arel/src/nodes/node.ts:8` — delete the `NodeVisitor` type
  (its only consumers are the methods being removed). Note `node.ts:68`
  (`engine.connection.visitor.accept(this, collector).value`) calls the
  _visitor's_ `accept`, which is real Rails (`visitor.rb:10`) and stays.
- `accept` removed from: `nodes/binary.ts`, `nodes/unary.ts`,
  `nodes/unary-operation.ts`, `nodes/join-source.ts`, `nodes/table-alias.ts`,
  `nodes/case.ts`, `nodes/fragments.ts`, `nodes/named-function.ts`,
  `nodes/window.ts`, `nodes/select-statement.ts`, `nodes/sql-literal.ts`,
  `attributes/attribute.ts`, `table.ts`, `nodes/infix-operation.ts`.
- Rewire the real callers. `grep -rn "\.accept(" packages/arel/src
packages/activerecord/src` — the arel-internal ones are
  `tree-manager.ts:70`, `visitors/dot.ts:544`, `visitors/to-sql.ts:201`,
  `visitors/to-sql.ts:208`; all already target a _visitor_. Any site that
  targets a node routes to `visitor.accept(node, collector)` instead.
  ActiveRecord's `schemaCreation.accept(...)` hits are a different class
  (`connection_adapters/abstract/schema_creation.rb`) and are untouched.

## Acceptance criteria

- No `accept` method remains on any `Arel::Nodes` / `Arel::Attributes` /
  `Arel::Table` class; `NodeVisitor` is gone.
- `pnpm parity:api:extra --package arel` total drops by a further **~15**;
  combined with the sibling story, every `MOVED: accept` row in arel is gone.
- `pnpm typecheck` clean (the deleted abstract member is the compile-time
  proof that no caller was left behind).
- `pnpm vitest run packages/arel` green.
- No new `@noRailsEquivalent` tag.
