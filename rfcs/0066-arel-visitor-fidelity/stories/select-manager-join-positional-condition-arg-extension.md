---
title: "SelectManager#join/outerJoin overload the klass arg with an ON predicate, forcing a divergent createJoin override"
status: ready
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SelectManager#join`'s second parameter is overloaded to accept **either** a
join class **or** a bare ON predicate. Rails' signature
(`vendor/rails/activerecord/lib/arel/select_manager.rb:102`) is
`join(relation, klass = Nodes::InnerJoin)` and it always passes `nil` as
`create_join`'s constraint (`:111`) — callers chain `.on(...)` instead.

The extension forces a second deviation: `SelectManager` overrides
`createJoin` (`packages/arel/src/select-manager.ts:624-633`) with
`new JoinKlass(to, constraint ? new On(constraint) : null)`, whereas Rails has
a single `FactoryMethods#create_join` that does **no** `On` wrap
(mirrored at `packages/arel/src/factory-methods.ts:63-69`). So trails carries
two `createJoin` definitions with divergent semantics; the override exists
only to serve the positional-condition arg.

`outerJoin` (`select-manager.ts:~238-248`) carries the same `onCondition`
extension arm for the same reason.

Surfaced during PR #5029, which converged the `String`/`SqlLiteral` case of
`join` but deliberately left this surface alone as out of scope.

Live callers passing a bare predicate positionally:

- `packages/activerecord/src/relation/query-methods.ts:2977`
  (`manager.join(tableNode, onNode)`, where `onNode` is `arelSql(j.on)`)
- `packages/activerecord/src/associations/association-scope.ts:637`
- several `packages/arel/src/select-manager.test.ts` call sites

## Acceptance criteria

- `SelectManager#join` takes `(relation, klass = InnerJoin)` only, matching
  `select_manager.rb:102-113`; the positional-predicate arm is gone.
- `outerJoin` takes `(relation)` only, matching `:115-117`.
- Callers converted to chain `.on(...)`.
- `SelectManager`'s `createJoin` override is deleted; the single
  `FactoryMethods.createJoin` serves all callers, matching Rails' one
  `create_join`.
- The `On` wrap moves to where Rails puts it (`SelectManager#on`).
- Note: `SelectManager.createJoin` currently shadows the `include()`-mixed
  `FactoryMethods.createJoin` — verify SQL still emits `ON` after removal
  (PR #5029 probed `INNER`/`LEFT OUTER`/bare-`SqlLiteral` shapes; reuse those).
- Full arel suite plus `association-scope`, `join-model`, `relation/` green.
