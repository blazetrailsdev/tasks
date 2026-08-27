---
title: "arel: SQLString/Composite/Grouping/quotedNode carry guards and fallbacks Rails does not have"
status: done
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: guard-parity
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7123
claim: "2026-08-27T15:57:56Z"
assignee: "arel-attribute-inlines-four-mixins"
blocked-by: null
closed-reason: null
---

## Context

Four arel bodies carry a guard or fallback arm Rails does not have. None is
caught by the call gates because each adds a branch rather than a call.

1. `packages/arel/src/collectors/sql-string.ts:17-25` `addBind` and `:27-43`
   `addBinds` fall back to appending `"?"` when no block is passed. Rails
   (`vendor/rails/activerecord/lib/arel/collectors/sql_string.rb:15-24`)
   always `yield`s — a missing block is a `LocalJumpError`, not a `?`.
2. `packages/arel/src/collectors/composite.ts:23-27` invents a `retryable`
   getter that ANDs the two children; Rails (`composite.rb:7,14-18`) is a plain
   `attr_reader :retryable` set by the writer. `composite.ts:52-53` guards
   `addBinds` with `if (this.left.addBinds)`; Rails (`composite.rb:32-36`)
   delegates bare. `composite.ts:21` defaults `preparable = true`; Rails'
   `attr_accessor :preparable` starts `nil`. The optional-`addBinds` guard
   exists only so `collectors/composite.test.ts:35-62` can pass a duck-typed
   collector double — a TS-only test propping up an invented arm.
3. `packages/arel/src/nodes/grouping.ts:19-29` `fetchAttribute` checks
   `typeof this.expr.fetchAttribute === "function"` before delegating; Rails
   (`grouping.rb:6-8`) is one line, `expr.fetch_attribute(&block)`.
4. `packages/arel/src/nodes/node-expression.ts:33-39` and
   `nodes/sql-literal.ts:94-96` `quotedNode` short-circuit on
   `other instanceof Node`; Rails' `quoted_node` (`predications.rb:244-246`) is
   `Nodes.build_quoted(other, self)` and `build_quoted` (casted.rb:48-60) already
   owns the pass-through `case` arm.

## Acceptance criteria

- `SQLString#addBind` / `#addBinds` take a required block and have no `"?"`
  arm; callers that relied on the fallback pass the block Rails passes.
- `Composite#retryable` is a stored field written by the setter; `addBinds`
  delegates unguarded; `preparable` has no default. The two TS-only tests in
  `collectors/composite.test.ts` either move to a `.trails.test.ts` with a real
  `Bind`/`SQLString` pair or are deleted.
- `Grouping#fetchAttribute` and the two `quotedNode`s are the one-line
  delegations Rails has.
- `collectors/*.test.ts`, `nodes/grouping.test.ts`, `predications.test.ts`
  stay green; no test renamed.
