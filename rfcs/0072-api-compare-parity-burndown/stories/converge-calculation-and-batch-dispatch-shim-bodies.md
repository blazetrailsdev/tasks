---
title: "Converge the calculation/batching dispatch shims that keep 9 wide primary_key entries baselined"
status: done
updated: 2026-08-02
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 5897
claim: "2026-08-02T17:33:25Z"
assignee: "converge-calculation-and-batch-dispatch-shim-bodies"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #5894 (converge-relation-primary-key-delegate-reads). That PR
routed the `Relation` delegate reads through `this.primaryKey` /
`this.tableName`, but the 9 wide-ratchet `primary_key` entries in the
relation cluster did NOT clear, and cannot clear via a read rewrite: the wide
extractor is receiver-agnostic for property reads
(`scripts/api-compare/extract-ts-api.ts:2380` — a `PropertyAccessExpression`
credits the property name regardless of receiver), so
`_modelClass.primaryKey` already counted as `primary_key`.

The entries persist because the ported bodies are thin dispatch shims with no
PK logic at all, while the Rails bodies do the work:

- `packages/activerecord/src/relation/calculations.ts:1408` `performCalculation`
  is a two-line group/simple dispatch; Rails `perform_calculation`
  (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:434-458`)
  computes `distinct`, resolves `column_name ||= select_for_count`, and sets
  `column_name = primary_key` before dispatching.
- `packages/activerecord/src/relation/calculations.ts:1446`
  `executeGroupedCalculation` immediately forwards to `groupedAggregate`;
  Rails `execute_grouped_calculation` (`calculations.rb:513-595`) resolves the
  belongs_to group association and does
  `association.klass.base_class.where(association.klass.base_class.primary_key => key_ids)`.
- `packages/activerecord/src/relation/calculations.ts:1420`
  `executeSimpleCalculation` likewise forwards to `singleAggregate` instead of
  porting `calculations.rb:468-511`.
- `packages/activerecord/src/relation/batches.ts:16`
  `ensureValidOptionsForBatchingBang` only validates the `:start`/`:finish`
  arity and `:order` values; Rails
  (`vendor/rails/activerecord/lib/active_record/relation/batches.rb:305-330`)
  also does the `Array(primary_key) - cursor` / `model.schema_cache.indexes(table_name)`
  unique-index check. That logic lives inline in `relation.ts` `inBatches`
  instead, which is why `relation/batches.ts` shows both a `primary_key` and a
  `table_name` omission.
- `relation/batches.ts` has no `batch_on_unloaded_relation` body at all, so the
  `model.unscoped.all.to_sql` empty-scope check (`batches.rb:432`) is unported.

Baselined entries live in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`,
`.../relation/batches.json`, `.../relation/calculations.json`.

## Acceptance criteria

- The calculation dispatch shims carry the Rails body logic they stand in for,
  or the divergence is justified at the call site with the Rails `file:line`.
- The `ensure_valid_options_for_batching!` unique-index check moves from
  `relation.ts` `inBatches` into `relation/batches.ts`, matching Rails' layout.
- `pnpm parity:api:calls:reseed` shrinks the wide baseline for this cluster; the
  entries that remain carry a real per-entry reason, not the seeded default.
- `pnpm parity:api` and `pnpm parity:test` deltas are non-negative.
