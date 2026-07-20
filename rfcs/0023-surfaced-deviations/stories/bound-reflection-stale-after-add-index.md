---
title: "Invalidate the bound schema reflection on index DDL"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`addIndex` invalidates only the RAW schema cache:

```ts
// packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:475
this.adapter.schemaCache?.clearDataSourceCacheBang(this.adapter.pool, tableName);
```

Nothing clears the `BoundSchemaReflection` that `adapter.schemaCacheBound`
returns (`connection-adapters/abstract-adapter.ts:1408`), which holds its own
`SchemaReflection`-backed cache. So a caller reading indexes through the
Rails-shaped one-arg `schemaCacheBound.indexes(tableName)` can be served a
STALE, pre-`addIndex` list after a migration adds an index.

Discovered in #4986: routing `covered_by_unique_index?` through
`schemaCacheBound` (the Rails-shaped form a reviewer reasonably suggested)
redded four pooled `UniquenessValidationWithIndexTest` cases — `changing non
unique attribute`, `scope`, `uniqueness on relation`, `index of sublist of
columns` — because the covering index added in each test was invisible. That PR
worked around it by reading the raw cache, with the reason documented on
`tableIndexes` in `validations/uniqueness.ts`.

The workaround is local. `insert-all.ts:493` (`uniqueIndexes`) prefers
`schemaCacheBound` and is exposed to the same staleness whenever DDL adds an
index mid-process — it happens not to be exercised that way today.

Rails has no split: `schema_cache` is one object, and
`ActiveRecord::ConnectionAdapters::SchemaCache#clear_data_source_cache!` clears
the single authoritative store.

## Acceptance criteria

- DDL that changes indexes (`addIndex` / `removeIndex`, and any sibling that
  clears the raw cache) invalidates the bound reflection's cache too, so
  `schemaCacheBound.indexes(tableName)` never serves a pre-DDL list.
- A regression test adds an index and asserts the bound form reflects it —
  verified RED against current `main`.
- Once converged, `tableIndexes` in `validations/uniqueness.ts` can drop its
  raw-cache workaround and its explanatory comment; either do that here or note
  it as a follow-up.
