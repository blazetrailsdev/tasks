---
title: "delete-schema-revision-and-decorator-replay-machinery"
status: done
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6809
claim: "2026-08-21T11:10:23Z"
assignee: "delete-schema-revision-and-decorator-replay-machinery"
blocked-by: null
closed-reason: null
---

## Context

Final split (4/4) of `converge-attribute-definitions-onto-default-attributes`:
once no reader outside `model-schema.ts` holds `_attributeDefinitions`, the
bespoke machinery that exists ONLY to keep the invented map coherent can go.

In `packages/activerecord/src/model-schema.ts` (line numbers on `origin/main`
2026-08-18, 27 occurrences of the map in this file alone):

- `_schemaRevision` (`:53-57` `schemaEpoch`/`nextSchemaEpoch`, `:74-104`
  `schemaStaleAgainstAncestors` / `ownSchemaMemo` / `ownProp`, and the stamp at
  the bottom of `applyColumnsHash`, `:1258`). Rails invalidates the class and
  its descendants directly (`vendor/rails/activerecord/lib/active_record/model_schema.rb:523`,
  `:553`) rather than running a global epoch counter, because
  `resetColumnInformation` mutates the map in place.
- `replayOwnPendingDecorators` (`packages/activemodel/src/attribute-registration.ts:447`,
  called from `model-schema.ts:1253`) and its `inDecoratorReplay` guard — a
  second replay path parallel to `PendingDecorator#applyTo`.
- `scrubSchemaSourcedDefinitions` — hand-partitions the map by
  `source === "schema"` on every reload; Rails' per-class replay does this for
  free.

Also delete the `blazetrails/schema-memo-read-through-guard` ESLint rule
(`eslint/schema-memo-read-through-guard.mjs` + its test and config entry) — it
exists only to police raw reads of the memos this slice removes. PR #6709
routed `enum.ts`'s read through `ownProp` for that guard; that call site goes
away here too.

## Acceptance criteria

- [x] `_schemaRevision`, `schemaEpoch` / `nextSchemaEpoch`, `_staleCheck`,
      `schemaStaleAgainstAncestors` and `ownProp` are all deleted, with
      invalidation pushed down the way Rails does it
      (`activerecord/lib/active_record/model_schema.rb:553-568`, `:523`).
- [x] `replayOwnPendingDecorators` is deleted, leaving `PendingDecorator#applyTo`
      as the single replay path. (Already gone from `origin/main` when this was
      claimed — no change needed.)
- [x] `blazetrails/schema-memo-read-through-guard` is deleted with its config
      registration and test.
- [x] The STI guards in `normalized-attribute.trails.test.ts` still pass
      (subclass decoration does not leak to base/siblings and survives reload).
- [x] No regression in `inheritance`, `attributes`, `model-schema`, `enum`,
      `dirty`, `sti/` and the `encryption/` suites.

### Split out of this story

Two names from the original first criterion moved, with the reasons measured on
`origin/main` at `fc521e1b3` rather than assumed:

- **`_attributeDefinitions` and `scrubSchemaSourcedDefinitions`** → filed as
  [[delete-attribute-definitions-map-and-schema-sourced-scrub]]. The map's owner
  story, `converge-attribute-definitions-activerecord-owners`, is itself
  `blocked` on sync schema reflection, and two of the four reader splits
  (`-core-readers`, `-peripheral-readers`) had not landed. Deleting the scrub
  alone reds 12 Rails-named `PersistenceTest` cases, because reflected columns
  still live in the map: the scrub has to die _with_ the map, in one change.
- **`ownSchemaMemo`** stays, collapsed to the own-property read it wrapped. Ruby
  class ivars are not inherited and JS statics are, so a bare `this._columnsHash`
  on a subclass would serve the base's memo and skip the subclass's own
  `load_schema!` (`model_schema.rb:587-597`). That is a genuine language
  shortcoming, not deferred debt — it was `ownProp` that was the duplicate, and
  it is gone.

## Dependencies

After slices 1-3.
