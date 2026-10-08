---
title: "activerecord: delete the model registry writers; models seat as constants where they are defined"
status: in-progress
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8697
claim: "2026-10-08T22:03:15Z"
assignee: "model-registry-writers-are-deleted-models-seat-as-constants"
blocked-by: null
closed-reason: null
---

## Context

Split from `model-class-names-resolve-through-constantize-not-a-model-registry`, which shipped the reader half: `AssociationReflection#computeClass` is now Rails' body over `active_record.send(:compute_type, name)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:490-510`), `MacroReflection#_klass` reads `active_record.name.demodulize` (`reflection.rb:426-432`), `activeRecordRegistryName` and `Base._registryKeys` are deleted, and `assign_nested_attributes_for_collection_association` reads `association.klass` (`nested_attributes.rb:514,527,532`). No reader in `packages/activerecord/src` reads `modelRegistry` any more.

The writers remain, all in `packages/activerecord/src/associations.ts` unless noted:

- `modelRegistry` (a `Map` subclass whose `set` / `delete` / `clear` write activesupport's constant table) and `registerModel`.
- `registerModelConstant`, and `Inheritance.registerSubclass` (`inheritance.ts`) which calls it before `DescendantsTracker.registerSubclass`.
- `autoloadModel`, the canonical test-model index's lazy fill. The reader half left it called from `computeType`'s candidate loop (`inheritance.ts`, receipted `@inventedArm autoloadModel`), `MacroReflection#computeClass` (`reflection.ts`), `delegated-type.ts` and `CollectionProxy._targetModelFor` (`associations/collection-proxy.ts`).
- `Associations.hasAndBelongsToMany` still writes `modelRegistry.set("<owner path>::HABTM_X", joinModel)` beside `rbModConstSet(self, joinModel.name, joinModel)`.

Measured blockers, from the reader-half PR:

- Deleting the HABTM flat seat reds `WithAnnotationsTest` "has and belongs to many with annotation includes a query comment" (`associations.test.ts`) and `ReflectionTest` "nested?" (`reflection.test.ts`): the owner (`SpacePirate`, `Category`) is a canonical model that nothing has seated, so `constantize("SpacePirate::HABTM_Parrots")` fails at the first segment. Rails' owner is a constant by definition (`associations/builder/has_and_belongs_to_many.rb:73`).
- `autoloadModel` cannot be deleted until every canonical model is seated where it is defined: 42 test files import `support/canonical-model-index.ts` for the lazy fill, and 14 `modelRegistry.clear()` / `resetConstants()` plus 25 `modelRegistry.delete(...)` call sites in tests rely on it refilling afterwards.
- `registerModel` has ~1,900 references across test files, plus `activerecord-cli/src/generate-manifest.ts:221-231`, `trailties/src/application/finisher.ts:73`, `test-fixtures.ts:658-664` and `support/setup-second-pool.ts:42-45`.
- `registerModel(name, model)` also runs `flushPendingCounterCacheColumns`; that flush has to move to where Rails runs it before the function can go.

## Converged shape

A model is seated once, where it is defined or loaded, with `rbModConstSet(owner, name, klass)` (CLAUDE.md § "Call-time constant resolution"). `modelRegistry`, `registerModel`, `registerModelConstant` and `autoloadModel` are deleted, and `Inheritance.registerSubclass` is only the `DescendantsTracker` half.

This is larger than one PR. Suggested order: seat every canonical model in `test-helpers/models/` at definition and delete `autoloadModel` and its four call sites; then move the counter-cache flush; then sweep `registerModel` call sites and delete the registry.

## Acceptance criteria

- [ ] Every class in `packages/activerecord/src/test-helpers/models/` is seated at definition, and `autoloadModel`, `_setCanonicalModelAutoloadIndex` and the `@inventedArm autoloadModel` receipt on `computeType` are deleted.
- [ ] `Associations.hasAndBelongsToMany` seats the join model with `rbModConstSet` only.
- [ ] `registerModel`, `registerModelConstant` and `modelRegistry` are deleted, and `registerSubclass` in `inheritance.ts` no longer registers a constant.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
