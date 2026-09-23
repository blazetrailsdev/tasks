---
title: "Retire activerecord test-support ar-db-slots or record it as test tooling"
status: done
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - activerecord
deps:
  - "converge-arel-node-slots-onto-autoload"
deps-rfc: []
est-loc: 60
priority: 8
pr: tasks#160
claim: "2026-09-23T14:38:45Z"
assignee: "converge-activerecord-support-db-slots"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/support/ar-db-slots.ts` lives under `src/support/**`, which sits outside both compare populations. It is test tooling, not a port of a Rails constant. Decide whether it becomes an `autoload` registration like the rest, or is plain test-harness state that needs no slot. The latter is likely when the cycle it breaks is test-only.

## Acceptance criteria

- `ar-db-slots.ts` is either migrated onto `autoload` (meeting the TDZ entry-module check), or replaced by test-harness state with no slot module and no cycle.
- `support/ar-db-slots.trails.test.ts` still covers the behaviour, under its current name.

## Resolution

The second acceptance arm holds already, so there is nothing to migrate. `ar-db-slots.ts` is not a zero-import slot: its "slots" are the test-DB pool.

- `slotPoolSize()` and `workerForkCount()` size the per-worker database pool from `AR_DB_FORKS` / `TRAILS_TEST_FORKS` / `AR_DB_SLOTS`. Its only consumers are the test harness (`test-setup-worker-db.ts`, `support/template-global-setup.ts`, and its two `.trails.test.ts` files).
- It exports no mutable binding and no `_setX()` setter, so there is no slot to replace.
- It imports only `@blazetrails/ruby-compat` and `./ar-db-forks-default.js`, and nothing in the model layer imports it, so it closes no cycle and there is no TDZ entry-module check to meet.

The file stays as it is, recorded as test tooling. RFC 0151's Verification glob and `rewrite-call-time-constant-resolution-onto-autoload`'s empty-glob criterion now exclude it by path.

## Verification

- `git grep -l "ar-db-slots" -- packages/` lists only `packages/activerecord/src/test-setup-worker-db.ts` and files under `packages/activerecord/src/support/`; the root `vitest.config.ts` names it in comments only.
- `pnpm vitest run packages/activerecord/src/support/ar-db-slots.trails.test.ts` is green, unchanged.
