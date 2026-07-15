---
title: "arel-valueslist-row-casts-assert-node-on-raw-values"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4873 (arel-raw-value-dispatch-raises-like-rails).

Two casts assert `Node` on rows that are declared — and, in Rails, genuinely
are — arbitrary values:

- `packages/arel/src/insert-manager.ts:100` — `new ValuesList([row as Node[]])`
  inside `createValues(row: unknown[])`.
- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:2069`
  — `manager.createValuesList(valuesList as Nodes.Node[][])`.

Both are now redundant: `ValuesList`'s constructor takes `unknown[][]`
(`packages/arel/src/nodes/values-list.ts:11`), `createValues` takes
`unknown[]`, and PR #4873 widened `createValuesList` to `unknown[][]` to match.
Rails' rows hold raw values — `create_values_list([%w{ a b }, %w{ c d }])`
(`vendor/rails/activerecord/test/cases/arel/insert_manager_test.rb:10`), quoted
by the visitor at `arel/visitors/to_sql.rb:112`.

They are inert today, so this is cleanup rather than a bug. It is worth doing
because the identical class of mistake actively masked a real break in that PR:
`createValuesList` declared `rows: Node[][]`, which type-checked
`schema-migration.ts`'s `[new Nodes.Quoted(v)]` rows while the narrowed
ValuesList `case` (`to_sql.rb:110`) sent them to `quote()` →
`TypeError: can't quote Quoted` (`abstract/quoting.ts:151`). A wrong annotation
hid a wrong call. These two casts assert the same untruth in the opposite
direction and will silently accept a Node row that Rails would raise on.

Reviewer flagged both as harmless, no-action; deferred at the review-cycle
limit rather than triggering another CI round.

## Acceptance criteria

- [ ] Both casts removed; the values flow as `unknown` end to end.
- [ ] No new cast introduced at the call sites to compensate.
- [ ] `pnpm -w typecheck` clean; arel + activerecord suites green.
- [ ] api:compare / test:compare delta non-negative.
