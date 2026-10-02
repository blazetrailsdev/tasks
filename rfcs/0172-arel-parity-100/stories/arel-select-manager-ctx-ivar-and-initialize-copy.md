---
title: "arel-select-manager-ctx-ivar-and-initialize-copy"
status: ready
updated: 2026-10-02
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

# arel: SelectManager keeps `@ctx` as an ivar and ports `initialize_copy`

## Context

`vendor/rails/v8.0.2/activerecord/lib/arel/select_manager.rb:11,16` seats
`@ctx = @ast.cores.last` in `initialize` and re-seats it in `initialize_copy`.
Every DSL method then reads `@ctx`: `constraints` (`:25`), `on` (`:70`),
`group` (`:80`), `from` (`:90-92`), `join` (`:111`), `having` (`:120`) and
`window` (`:126`).

`packages/arel/src/select-manager.ts` has no `ctx` field. It derives `core`
at each read instead, so `SelectManager#initialize_copy` could not be ported
alongside the other arel copy hooks (trails#8302). trails inherits
`TreeManager#initializeCopy` there. That gives the same result only because
`core` is recomputed on every read.

## Acceptance criteria

- [ ] `SelectManager` holds a `ctx` field seated in the constructor as
      `select_manager.rb:11` does, and every `@ctx` reader uses it.
- [ ] `initializeCopy(other)` is ported with `select_manager.rb:14-17`'s body
      (`super`, then `this.ctx = this.ast.cores.at(-1)`).
- [ ] `pnpm vitest run packages/arel` green; `parity:api:extra:gate` not raised.
