---
title: "Move the ActiveRecord save-side dirty surface out of activemodel/model.ts"
status: done
updated: 2026-08-22
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel", "activerecord"]
deps:
  - move-ar-attribute-read-write-surface-out-of-model
deps-rfc: []
est-loc: 320
priority: null
pr: 6858
claim: "2026-08-22T14:02:53Z"
assignee: "move-ar-save-side-dirty-surface-out-of-model"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/dirty.rb` has no save-side family.
`vendor/rails/activerecord/lib/active_record/attribute_methods/dirty.rb` does:
`attribute_before_last_save` (`:108`), `saved_changes?` (`:113`),
`saved_changes` (`:118`), `attribute_in_database` (`:164`),
`has_changes_to_save?` (`:169`), `changes_to_save` (`:175`), plus
`will_save_change_to_attribute?`, `saved_change_to_attribute`,
`changed_attribute_names_to_save`, `attributes_in_database`.

trails defines all eleven on `ActiveModel::Model`:

- `model.ts:2167` `hasChangesToSave` (3L)
- `model.ts:2201` `willSaveChangeToAttribute` (3L)
- `model.ts:2219` `willSaveChangeToAttributeValues` (3L)
- `model.ts:2232` `savedChanges` (3L)
- `model.ts:2241` `savedChangeToAttribute` (10L)
- `model.ts:2262` `attributeBeforeLastSave` (5L)
- `model.ts:2274` `attributeInDatabase` (4L)
- `model.ts:2284` `changedAttributeNamesToSave` (3L)
- `model.ts:2294` `changesToSave` (3L)
- `model.ts:2304` `attributesInDatabase` (7L)
- `model.ts:2312` `savedChangeToAttributeValues` (4L)

48 code lines. Destination `packages/activerecord/src/attribute-methods/dirty.ts`
already exists (250 lines).

Two known traps, both already recorded in `base.ts:4813-4818`:

1. Several of these are **getters** on `Model.prototype`; wiring a getter
   through `include()` turns it into a data property. Same hazard as the
   read/write story — preserve descriptors and assert it.
2. `savedChangeToAttribute` **differs in return type** between the two: the
   `Model` version returns `boolean`, ActiveRecord's returns the
   `[before, after]` pair. Rails has both, under different names
   (`saved_change_to_attribute?` vs `saved_change_to_attribute`). Port both
   arms at the Rails spellings — CLAUDE.md, "Bang methods raise; the non-bang
   form returns falsy" and "Predicates return a value". The trails-invented
   `savedChangeToAttributeValues` and `willSaveChangeToAttributeValues` names
   (both `novel` in `parity:api:extra`) exist only because the predicate
   spelling was taken; they go away.

## Acceptance criteria

- The eleven members live in
  `packages/activerecord/src/attribute-methods/dirty.ts` at their Rails names.
- `savedChangeToAttributeValues` and `willSaveChangeToAttributeValues` are
  deleted; their call sites use the Rails-named pair.
- Getters stay getters; a test asserts the property descriptor kind.
- `model.ts` keeps only the ActiveModel `dirty.rb` names (that residue is a
  separate story).
- `pnpm parity:api:extra --package activemodel` loses all eleven rows from
  `model.ts`, including both `novel` ones.
- Both packages' parity deltas non-negative; `pnpm parity:api:calls` / `:args`
  clean, no reseed; stranded rows in
  `call-mismatches-exclude/activemodel/dirty.json` hand-deleted then
  `pnpm parity:api:calls:tighten activemodel/dirty.json`.

## Verification

```bash
pnpm vitest run packages/activerecord/src/attribute-methods/dirty.test.ts packages/activemodel/src/dirty.test.ts packages/activemodel/src/attributes-dirty.test.ts
```
