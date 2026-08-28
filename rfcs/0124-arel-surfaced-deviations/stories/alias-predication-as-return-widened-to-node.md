---
title: "arel: AliasPredication#as declares a Node return, forcing six As casts at call sites"
status: in-progress
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7140
claim: "2026-08-27T23:29:14Z"
assignee: "alias-predication-as-return-widened-to-node"
blocked-by: null
closed-reason: null
---

## Context

`Arel::AliasPredication#as` returns an `As` node
(`vendor/rails/activerecord/lib/arel/alias_predication.rb:5-7`:
`Nodes::As.new self, Nodes::SqlLiteral.new(other, retryable: true)`).
`Arel::Nodes::Function#as` (`nodes/function.rb:17-20`), `Arel::Table#as`
(`table.rb:70-72`) and `Arel::SelectManager#as` (`select_manager.rb:107-109`)
override it and return `self` / a `TableAlias`.

In Ruby that costs nothing. In TypeScript the mixin's declared return type is
inherited by every host class, and an overriding class member must be
assignable to it — so `AliasPredicationModule` in
`packages/arel/src/alias-predication.ts:16` widens its return to `Node` to
accommodate `Function#as`, whose merged interface reaches it through
`NodeExpression`.

Before PR #7123 the widening was invisible: `binary.ts`, `case.ts`,
`extract.ts`, `grouping.ts`, `infix-operation.ts` and `unary-operation.ts` each
redefined `as` with an `As` return, so callers got the narrow type. That PR
removed those six redefinitions (story
`arel-node-subclasses-redefine-as-asc-desc`) and the widening surfaced as six
`as Nodes.As` casts at call sites that are genuinely handed an `As`:

- `packages/activerecord/src/associations/join-dependency.ts:138`
- `packages/arel/src/nodes/as.test.ts:10,17`
- `packages/arel/src/nodes/case.test.ts:87`
- `packages/arel/src/nodes/node.test.ts:33-34`
- `packages/arel/src/nodes/infix-operation.test.ts:16`
- `packages/arel/src/nodes/unary-operation.test.ts:15`

The casts are correct at runtime but they are the wrong shape: a caller of
`table[:id].as("x")` should not have to assert what Rails guarantees.

## Converged shape

Narrow the mixin back to `as(other: string | SqlLiteral): As` and give the three
genuine Rails overriders their own declaration that TypeScript accepts —
likely by keeping `Function` / `Table` / `SelectManager` out of the
`AliasPredicationModule` merge and declaring their `as` locally, rather than by
widening the shared module for all hosts. Then delete the six casts above.

Note this is NOT a licence to reintroduce the six subclass `as` bodies PR #7123
removed — the methods must still resolve through the `include()` wiring in
`index.ts`; only the declared type changes.

## Acceptance criteria

- `AliasPredicationModule#as` returns `As`, matching alias_predication.rb:5-7.
- The six `as Nodes.As` casts listed above are gone.
- `binary.ts`, `case.ts`, `extract.ts`, `grouping.ts`, `infix-operation.ts`,
  `unary-operation.ts` still define no own `as`.
- `pnpm parity:api --package arel` stays 957/957;
  `pnpm parity:api:extra:gate` stays novel 0 / total <= 40.
- No test renamed.
