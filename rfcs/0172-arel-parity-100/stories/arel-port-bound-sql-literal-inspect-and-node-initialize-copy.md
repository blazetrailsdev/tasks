---
title: "arel: port BoundSqlLiteral#inspect and the Comment / Window initialize_copy bodies"
status: ready
updated: 2026-09-30
rfc: "0172-arel-parity-100"
cluster: api-surface
packages: ["arel"]
deps: ["parity-100-rehome-postponed-rfc-dependencies", "arel-node-dup-missing"]
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` scores arel at **1041/1044** methods. The three misses are all Ruby
value-protocol definitions that RFC 0156 enrolled for scoring
(`PROTOCOL_DEFINITION_ENROLLED_PACKAGES`, `scripts/parity/conventions.ts`):

- `Arel::Nodes::BoundSqlLiteral#inspect` — `vendor/rails/v8.0.2/activerecord/lib/arel/nodes/bound_sql_literal.rb:60`; trails'
  `packages/arel/src/nodes/bound-sql-literal.ts` has no `inspect`.
- `Arel::Nodes::Comment#initialize_copy` — `vendor/rails/v8.0.2/activerecord/lib/arel/nodes/comment.rb:13`
  (`@values = @values.clone`); `packages/arel/src/nodes/comment.ts` has none.
- `Arel::Nodes::Window#initialize_copy` — `vendor/rails/v8.0.2/activerecord/lib/arel/nodes/window.rb:50,76`
  (deep-copies `@orders` / `@partitions` / `@framing`); `packages/arel/src/nodes/window.ts` has none.

`initialize_copy` only means something once nodes can be copied: `arel-node-dup-missing`
(RFC 0023) adds `Node#dup` through the slot machinery in `packages/arel/src/nodes/node-slots.ts`.
This story ports the two per-class copy hooks that `dup` must call, and the `inspect` override.

## Acceptance criteria

- [ ] `BoundSqlLiteral#inspect` renders `#<Arel::Nodes::BoundSqlLiteral ...>` exactly as `nodes/bound_sql_literal.rb` does, through ruby-compat's `rbInspect` for the embedded values.
- [ ] `Comment#initializeCopy` and `Window#initializeCopy` copy the same ivars Rails copies, and `Node#dup` (from `arel-node-dup-missing`) invokes them.
- [ ] The Rails clone tests that pin this (`test/cases/arel/nodes/window_test.rb`, `comment_test.rb`) assert against the dup'd node, not a twin.
- [ ] `pnpm parity:api` arel methods: 1041/1044 → **1044/1044**; `pnpm parity:api:extra:gate` stays green.

## Verification

```bash
pnpm parity:api && pnpm parity:api:extra:gate
pnpm vitest run packages/arel/src/nodes
```
