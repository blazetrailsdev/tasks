---
title: "Converge resetColumnInformation to sync reload + remove eager-warm refreshBang scaffolding"
status: ready
updated: 2026-07-08
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: ["columnshash-sync-schema-cache-reload-vs-sibling-borrow"]
deps-rfc: []
est-loc: 90
priority: 16
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up convergence for `reestablish-schema-warm-after-reset-column-information`
(PR #4743). That story re-established the eager schema-cache warm after
`resetColumnInformation` — but only under the opt-in
`SchemaReflection.eagerLoadSchemaCache`, and via trails-only machinery that has
no Rails analogue, because trails' schema layer is async and cannot do Rails'
synchronous blocking reload.

Rails `reset_column_information` (`vendor/rails/activerecord/lib/active_record/model_schema.rb:523`)
unconditionally calls `schema_cache.clear_data_source_cache!(table_name)` and
relies on the next `column_names` access (`columns.map(&:name)`) to re-reflect
synchronously from the connection. trails cannot block, so PR #4743 instead:

- keeps the old cache entry warm and re-introspects in place via a new
  `SchemaCache#refreshBang` (`packages/activerecord/src/connection-adapters/schema-cache.ts:265`),
  fired best-effort from the eager-warm branch of `clearAdapterDataSourceCache`
  (`packages/activerecord/src/model-schema.ts:728`);
- adds a per-table `_refreshGeneration` counter (schema-cache.ts) to serialize
  overlapping async refreshes (latest-initiated wins, on both the success and
  failure paths).

Residual divergences from Rails that this story converges:

1. **Default (flag-off) path still goes cold after reset.** Without
   `eagerLoadSchemaCache`, `clearAdapterDataSourceCache` still does a plain
   `clearDataSourceCacheBang`, so the next synchronous `columnNames()` can
   re-include virtual `attribute()` declarations until an async load re-warms
   the table. Rails never has this window.
2. **Stale-warm window under eager warm.** The refresh-in-place serves
   stale-but-warm columns until the async reflection lands — data Rails would
   never return (it blocks and returns fresh).
3. **Trails-only scaffolding with no scheduled removal.** `refreshBang`, the
   `_refreshGeneration` counter, and the `eagerLoadSchemaCache` branch in
   `clearAdapterDataSourceCache` exist solely to simulate synchronous
   reflection.

This is the same root blocker tracked by
`columnshash-sync-schema-cache-reload-vs-sibling-borrow` (this RFC,
`blocked-by: "trails has no sync DB reflection"`, deps-rfc
`0031-schema-cache-always-warm-convergence`). Hence the dep: this story cannot
land until that synchronous cold-load path exists. It mirrors that story's
pattern of scheduling removal of a trails-only workaround
(`borrowSameTableColumns`) once the faithful cache path arrives.

## Acceptance criteria

- Once trails has a synchronous cold-load reflection path (the convergence
  owned by `columnshash-sync-schema-cache-reload-vs-sibling-borrow`),
  `resetColumnInformation` converges to Rails' behavior:
  `clear_data_source_cache!(table_name)` unconditionally, then a synchronous
  reload on the next `columnNames()` / `columnsHash()` — no eager-warm-gated
  branch.
- `SchemaCache#refreshBang`, the `_refreshGeneration` counter, and the
  `SchemaReflection.eagerLoadSchemaCache` branch in
  `clearAdapterDataSourceCache` (`model-schema.ts`) are deleted once the sync
  reload makes them redundant — OR a decision is recorded that the eager path
  stays as an opt-in production optimization with the default path made
  faithful, matching how `columnshash-sync-schema-cache-reload-vs-sibling-borrow`
  frames its `borrowSameTableColumns` removal-or-keep decision.
- The default (flag-off) `resetColumnInformation` path no longer leaves a
  synchronous `columnNames()` reading virtual attributes after a reset without
  an intervening `await ensureSchemaLoaded()`.
- The `refreshBang` regression tests in
  `packages/activerecord/src/connection-adapters/schema-cache.test.ts` and the
  eager/off dispatch tests in
  `packages/activerecord/src/model-schema-sync-load.test.ts` are updated or
  removed to reflect the converged path (whichever the decision above dictates).
