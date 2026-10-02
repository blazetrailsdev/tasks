---
title: "arel-mixin-includes-into-class-bodies"
status: in-progress
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8374
claim: "2026-10-02T01:41:55Z"
assignee: "arel-mixin-includes-into-class-bodies"
blocked-by: null
closed-reason: null
---

## Context

Rails `include`s each arel mixin in the including class's own body:
`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/node.rb` (`include Arel::FactoryMethods`),
`nodes/node_expression.rb` (Expressions, Predications, AliasPredication, OrderPredications, Math),
`nodes/infix_operation.rb` (same five), `nodes/sql_literal.rb:6-9`,
`nodes/function.rb` (WindowPredications, FilterPredications), `nodes/filter.rb` (WindowPredications),
`table.rb` (FactoryMethods, AliasPredication), `tree_manager.rb` (FactoryMethods).

trails does all of that wiring at package init in `packages/arel/src/index.ts`
(the `include(_Node, …)` … `include(FilterNode, …)` block), because the mixin
modules (`factory-methods.ts`, `predications.ts`, `math.ts`, `expressions.ts`,
`alias-predication.ts`, `order-predications.ts`, `filter-predications.ts`,
`window-predications.ts`) import concrete node classes at module scope, so an
`include()` in `node.ts` / `node-expression.ts` would close a module-eval cycle
and read `Node` in TDZ. The free-form `@noRailsEquivalent` that excused this
was removed by `arel-converge-freeform-no-rails-equivalent-receipts` (it sat on
an import and excused no measured surface); the deviation itself remains.

`Attribute` already wires its own mixins in `attributes/attribute.ts`, which is
the target shape. The settled cycle-breaker is CLAUDE.md § "Call-time constant
resolution": read node classes in mixin bodies as `Nodes.X` off
`packages/arel/src/namespaces.ts` at call time, so the mixin modules take no
runtime edge onto node files.

## Acceptance criteria

- [ ] Each mixin module reads the node classes it builds through `Nodes.*` at call time, with no runtime import of a node file.
- [ ] Each `include()` moves out of `packages/arel/src/index.ts` into the file mirroring the Rails class body that includes it, in Rails' include order.
- [ ] A plain-node import of each built `dist/**.js` node module as the entry module does not throw (CLAUDE.md: a vitest run masks TDZ).
- [ ] `pnpm vitest run packages/arel` and `pnpm parity:api:extra:gate` green.
