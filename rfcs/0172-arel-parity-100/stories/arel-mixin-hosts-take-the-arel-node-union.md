---
title: "arel: the Predications/Expressions/Math mixin hosts take the arel_node? union, not Node"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::Predications`, `Arel::Expressions`, `Arel::Math`,
`Arel::AliasPredication` and `Arel::OrderPredications` are included by
`Arel::Attributes::Attribute`
(`vendor/rails/v8.0.2/activerecord/lib/arel/attributes/attribute.rb:5-10`) and
all but `Math` by `Arel::Nodes::SqlLiteral`
(`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/sql_literal.rb:5-9`), neither
of which is an `Arel::Nodes::Node`.

trails types the host of every method in those mixins as `this: Node`
(`packages/arel/src/predications.ts`, `expressions.ts`, `math.ts`,
`alias-predication.ts`, `order-predications.ts`; 38 sites). That is true only while
`Attribute` and `SqlLiteral` extend `Node`.

trails PR 8400 (`arel-signatures-take-the-arel-node-union`) widened the
parameters and fields but left these hosts alone, because they raise no error:
with both `extends Node` removed locally, `tsc --build packages/arel` is clean.
The mixins reach the two classes through the `*Module` interfaces and
`include()`, which do not check `this`. So the swap story will not be told about
them by the compiler.

## Acceptance criteria

- [ ] Every `this: Node` in the five mixins included by `Attribute` or
      `SqlLiteral` is `this: ArelNode` (exported from `packages/arel/src/arel.ts`),
      or the narrower host interface the file already uses.
- [ ] No body gains a cast or a guard to satisfy the wider host; a body that
      calls a `Node`-only method on `this` is reported in the PR, with the Rails
      `file:line`, not patched.
- [ ] `pnpm typecheck`, `pnpm vitest run packages/arel` and
      `pnpm parity:api:extra:gate` green. Types only.
