---
title: "delete-schema-revision-and-decorator-replay-machinery"
status: claimed
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
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

- [ ] `_attributeDefinitions`, `_schemaRevision`, `schemaEpoch`,
      `schemaStaleAgainstAncestors`, `ownSchemaMemo`, `ownProp` and
      `scrubSchemaSourcedDefinitions` are all deleted.
- [ ] `replayOwnPendingDecorators` is deleted, leaving `PendingDecorator#applyTo`
      as the single replay path.
- [ ] `blazetrails/schema-memo-read-through-guard` is deleted with its config
      registration and test.
- [ ] The STI guards in `normalized-attribute.trails.test.ts` still pass
      (subclass decoration does not leak to base/siblings and survives reload).
- [ ] No regression in `inheritance`, `attributes`, `model-schema`, `enum`,
      `dirty`, `sti/` and the `encryption/` suites.

## Dependencies

After slices 1-3.
