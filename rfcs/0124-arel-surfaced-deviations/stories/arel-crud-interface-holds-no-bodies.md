---
title: "arel-crud-interface-holds-no-bodies"
status: claimed
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-28T01:46:55Z"
assignee: "arel-crud-interface-holds-no-bodies"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Arel::Crud` is a module with four bodies
(`vendor/rails/activerecord/lib/arel/crud.rb:6-47`: `compile_insert`,
`create_insert`, `compile_update`, `compile_delete`) that `SelectManager`
`include`s (`select_manager.rb:6`).

trails' `packages/arel/src/crud.ts:10-24` is a bare `interface Crud` with the
four signatures and **no bodies**; the bodies are written directly on
`SelectManager` at `packages/arel/src/select-manager.ts:295-338`.
`parity:api` credits `crud.rb` 4/4 because the interface declares the names,
but a Rails developer opening `crud.ts` next to `crud.rb` finds nothing to
compare, and `select-manager.ts` carries 44 lines Rails keeps in another file.

The settled trails idiom for a Ruby module is `this`-typed functions in the
Rails file plus `include()` (CLAUDE.md "Module mixins"; `alias-predication.ts:10`
and `order-predications.ts` in this package already do it).

## Acceptance criteria

- `crud.ts` holds the four bodies as `this`-typed functions (or a
  `Crud` module object) in crud.rb's order, each body line-for-line with
  crud.rb:7-46 (`im`, `um`, `dm` locals kept).
- `select-manager.ts` `include()`s `Crud` (or assigns the four functions)
  and no longer defines the bodies itself; the `Crud` interface remains only
  if a type surface is genuinely needed, tagged
  `@noRailsEquivalent PERMANENT <reason>`.
- `pnpm parity:api --package arel` stays 957/957; `parity:api:extra:gate`
  and both call gates stay green with no new baseline row.
- `select-manager.test.ts` / `crud` tests green; no test renamed.
