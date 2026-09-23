---
title: "Retire activerecord test-support ar-db-slots or record it as test tooling"
status: ready
updated: 2026-09-15
rfc: "0151-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - activerecord
deps:
  - "converge-arel-node-slots-onto-autoload"
deps-rfc: []
est-loc: 60
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/ar-db-slots.ts` lives under `src/support/**`, which sits outside both compare populations. It is test tooling, not a port of a Rails constant. Decide whether it becomes an `autoload` registration like the rest, or is plain test-harness state that needs no slot. The latter is likely when the cycle it breaks is test-only.

## Acceptance criteria

- `ar-db-slots.ts` is either migrated onto `autoload` (meeting the TDZ entry-module check), or replaced by test-harness state with no slot module and no cycle.
- `support/ar-db-slots.trails.test.ts` still covers the behaviour, under its current name.

## Resolution

`ar-db-slots.ts` is not a zero-import slot. Its "slots" are the test-DB pool: `slotPoolSize()` and `workerForkCount()` size the per-worker database pool from `AR_DB_FORKS` / `TRAILS_TEST_FORKS` / `AR_DB_SLOTS`. It exports no mutable binding and no `_setX()` setter. Its imports are `@blazetrails/ruby-compat` and `./ar-db-forks-default.js`, so it closes no cycle. It stays as it is, recorded here as test tooling, and the RFC Verification glob excludes it.
