---
title: "register-model-wrapper-is-deleted-tests-seat-constants"
status: draft
updated: 2026-10-09
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

Split from `model-registry-and-register-model-are-deleted`, which shipped the src convergence: `modelRegistry`, `registerModelConstant`, the pending counter-cache deferral (`counter-cache-state.ts`, `flushPendingCounterCacheColumns`) and the flush loop in `support/canonical-model-index.ts` are deleted, `Inheritance.registerSubclass` (`packages/activerecord/src/inheritance.ts`) no longer seats a constant, and no canonical model file under `test-helpers/models/` calls `registerModel`.

What remains is `registerModel` itself (`packages/activerecord/src/associations.ts`), now a wrapper over `registerConstant` that checks the argument is a `Base` subclass, seats the qualified `rbModName` when it differs from the JS name, and in its array form also calls `registerSubclass`. Rails has no counterpart: `class Foo < ActiveRecord::Base` seats the constant by itself.

Callers still to convert:

- ~1,800 references across ~230 `*.test.ts` files, mostly `registerModel(Foo)` after a test-local class. Each becomes `registerConstant("Foo", Foo)` (or `rbModConstSet(Namespace, "Foo", Foo)`), placed directly after the class so a later `belongs_to ... counter_cache` resolves its target at definition time, as `vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/belongs_to.rb:39-40` does. There is no deferral any more, so a test that declares the owner before the target gets no `_counter_cache_columns` entry, which is what Rails does.
- Array-form callers also need an explicit `registerSubclass` for each STI subclass.
- `packages/activerecord-cli/src/generate-manifest.ts:221-231` and `packages/trailties/src/application/finisher.ts:73` emit / call `registerModel` for application models; this is app-facing surface and needs its replacement decided.
- `packages/activerecord/src/test-fixtures.ts` (`registerModel(models)` in `fixtures`) and `support/setup-second-pool.ts`.
- `register-model-batch.trails.test.ts` and `register-model-canonical-guard.trails.test.ts` test the wrapper only and go with it.

The sweep is far over one PR's LOC ceiling as a mechanical change, so it needs either a ceiling waiver or a split by directory.

## Acceptance criteria

- [ ] `registerModel` is deleted from `associations.ts` and from the `index.ts` export, with its `@noRailsEquivalent` receipt.
- [ ] `registerSubclass` in `inheritance.ts` either converges onto its Rails counterpart or keeps a receipt pointing at a live story.
- [ ] Generated application code and the finisher seat models without `registerModel`.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
