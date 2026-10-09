---
title: "modelRegistry and the pending counter-cache deferral are deleted; registerModel wraps registerConstant"
status: draft
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
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

## Context

Split from `model-registry-writers-are-deleted-models-seat-as-constants`, which shipped the first step: every exported class in `packages/activerecord/src/test-helpers/models/` is seated where it is defined (`registerConstant("Name", Klass)` after the class, or `rbModConstSet(Namespace, "Name", this)` for a namespaced one), `autoloadModel`, `_setCanonicalModelAutoloadIndex` and the canonical-name shadow guard are deleted, `computeType` (`inheritance.ts`) carries no `@inventedArm` receipt, and `Associations.hasAndBelongsToMany` seats the join model with `rbModConstSet` only (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb:73`).

What remains, all in `packages/activerecord/src/associations.ts` unless noted:

- `modelRegistry` (a `Map` subclass whose `set` / `delete` / `clear` write the constant table), `registerModel` and `registerModelConstant`, each receipted `@noRailsEquivalent CONVERGEABLE model-registry-writers-are-deleted-models-seat-as-constants` (retarget the receipts to this story).
- `Inheritance.registerSubclass` (`inheritance.ts`) still calls `registerModelConstant` before `DescendantsTracker.registerSubclass`.
- `registerModel(name, model)` runs `flushPendingCounterCacheColumns` (`counter-cache.ts`). The pending deferral itself is `eliminate-pending-counter-cache-deferral-via-lazy-target-resolution`; Rails unions the column at `associations/builder/belongs_to.rb:39-40` with the target already a constant. `support/canonical-model-index.ts` now flushes every pending entry once the whole canonical index has loaded, standing in for the flush `autoloadModel` used to reach through `registerModel`; that loop goes with the flush.
- `registerModel` has ~1,900 references across test files, plus `activerecord-cli/src/generate-manifest.ts:221-231`, `trailties/src/application/finisher.ts:73`, `test-fixtures.ts:658-664`, `support/setup-second-pool.ts:42-45`, and a handful of canonical model files (`parrot.ts`, `person.ts`, `bird.ts`, `clothing-item.ts`, `membership.ts`, `company.ts`, `company-in-module.ts`).
- `test-helpers/models/sharded/*.ts` duplicates `test-helpers/models/sharded.ts`, is imported by nothing, and is unseated; `Coder` in `admin/user.ts` and `admin/user-json.ts` is Rails' nested `Admin::User::Coder` and is unseated.

## Scope decision

Narrowed by the repo owner on trails#8701: this story ships the src convergence and keeps `registerModel` as a wrapper over `registerConstant`. Deleting `registerModel` and converting its ~1,800 test references, `generate-manifest.ts`, `finisher.ts`, `test-fixtures.ts` and `support/setup-second-pool.ts` is `register-model-wrapper-is-deleted-tests-seat-constants`.

## Acceptance criteria

- [ ] The pending counter-cache deferral is deleted: `addCounterCacheCallbacks` resolves the target once, as `associations/builder/belongs_to.rb:39-40` does, and the flush loop in `support/canonical-model-index.ts` is gone.
- [ ] `registerModelConstant` and `modelRegistry` are deleted; `registerModel` only seats constants through `registerConstant`, and no canonical model file calls it.
- [ ] `registerSubclass` in `inheritance.ts` no longer registers a constant.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
