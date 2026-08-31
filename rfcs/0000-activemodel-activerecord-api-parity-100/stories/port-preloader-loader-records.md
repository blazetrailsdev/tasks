---
title: "Port the LoaderRecords seat in preloader/association and the loaders reader on preloader/batch"
status: draft
updated: 2026-08-31
rfc: "0000-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`associations/preloader/association.rb` sits at 37/41 and
`associations/preloader/batch.rb` at 3/4. All five are genuinely absent — none
declaration-only.

Rails — `associations/preloader/association.rb:60-97`, the nested
`LoaderRecords` class: `initialize` seeds `@keys_to_load` and
`@already_loaded_records_by_key` and calls
`populate_keys_to_load_and_already_loaded_records` (`:78`), whose body walks
each loader's `owners_by_key`, routes an already-loaded owner's target into
`already_loaded_records_by_key` and everything else into `keys_to_load`, then
subtracts the loaded keys. `records` is `load_records + already_loaded_records`
(`:71`); the four private readers come from the `attr_reader` at `:76`.

`preloader/batch.rb`'s missing `loaders` is the same shape — a private
`attr_reader` on the batch.

The nested class is in the compare denominator by construction
(`compare.ts:2412-2423` — a same-file nested class is measured against the same
TS file), so it cannot be skipped.

These belong together: `batch.rb`'s `loaders` is the collection
`LoaderRecords` consumes, and porting the reader without the consumer leaves a
member with no caller.

## Acceptance criteria

- `LoaderRecords` exists in
  `packages/activerecord/src/associations/preloader/association.ts` with
  `keysToLoad`, `alreadyLoadedRecordsByKey`,
  `populateKeysToLoadAndAlreadyLoadedRecords` and `alreadyLoadedRecords`,
  each carrying `@internal` (all four are private in Rails), and `records` is
  `loadRecords()` plus `alreadyLoadedRecords` as Rails writes it.
- `loaders` is a member of `preloader/batch.ts`, `@internal`.
- activerecord `associations/preloader/association.rb` reaches **41/41** and
  `associations/preloader/batch.rb` **4/4**; package total rises by 5.
- A test covers the branch that matters: preloading a key whose owner is
  already loaded must not re-query for that key.
- All adapter lanes pass; `pnpm parity:api:calls` and `:calls:args` clean.

## Definition of done

Porting the four readers without the `records` path that consumes them does not close this story — members with no caller are the misleading-surface defect CONTRIBUTING.md names.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
pnpm vitest run packages/activerecord/src/associations/preloader
```

The already-loaded-owner branch is the one worth a test: preloading a key whose
owner is already loaded must issue no query for that key.
