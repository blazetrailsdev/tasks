---
title: "activerecord: in_batches skips the unique-index check on a cold index cache and validates twice"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8713, which moved `in_batches`' option validation ahead of `act_on_ignored_order`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/batches.rb:258-265`).

Rails' `ensure_valid_options_for_batching!` (`batches.rb:305-325`) reads
`model.schema_cache.indexes(table_name)` in line and raises
`":cursor must include a primary key or other unique column(s)"` when no unique index covers the
cursor. In trails that lookup is an awaited query, and the blockless arm of `inBatches` returns its
`BatchEnumerator` synchronously, so `packages/activerecord/src/relation/batches.ts` does this:

- `ensureValidOptionsForBatchingBang` is synchronous and peeks at the index cache through
  `schemaCache().getCachedIndexes(tableName)`. On a cold cache the peek answers `undefined` and the
  unique-index check is skipped (`if (indexes !== undefined)`).
- `inBatches`' batch run then awaits `schemaCache().indexes(tableName)` and calls the validator a
  second time, so a bad `cursor` on a cold cache raises at iteration (blockless) or as a rejection
  (block) where Rails raises at the call. The warm runs on every batch run.

The receipts are `@inventedArm if`, `@missingRailsCall indexes` on the validator and
`@inventedArm indexes` on `inBatches`, each `CONVERGEABLE` against this story.

The `:start`, `:finish` and `:order` checks already run at the call. Only the index arm is left.
One path: warm the index cache in the explicit schema warm step
(`loadSchemaFromAdapter` in `model-schema.ts`, `SchemaCache#addAll`), so a loaded model's peek is
never cold, then delete the skip and the second validation. A model whose first touch is
`inBatches` is still cold, so that path also needs an answer for the unloaded model.

## Acceptance criteria

- [ ] `inBatches` validates once, and a `cursor` with no unique index raises at the call for both
      arms, or the cold-peek shape is ratified in `packages/activerecord/CLAUDE.md`
      § "Schema reflection peeks at a warm cache" and the three receipts become `PERMANENT`.
- [ ] `batches.test.ts` "in batches with custom columns raises when non unique columns" stays green.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:throws` green.
