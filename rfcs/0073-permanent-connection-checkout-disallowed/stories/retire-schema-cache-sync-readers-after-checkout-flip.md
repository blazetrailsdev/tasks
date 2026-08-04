---
title: "retire the schema-cache sync readers once checkouts can block"
status: draft
updated: 2026-08-04
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`retire-schema-cache-sync-and-ledger-shims` (RFC 0072) classified the tagged
schema-cache shims and found that all of the remaining ones are downstream of
one fact: trails' schema-cache accessors are sync where Rails' block on a
checkout (`columns_hash(pool, table)`, `data_source_exists?(pool, name)`,
`primary_keys(pool, table)`, `add(pool, table_name)` —
vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb).
They were therefore re-marked `@internal` (or, for `eagerLoadSchemaCache`,
tagged CONVERGEABLE naming this story) rather than retired:

- `getCachedColumnsHash` (packages/activerecord/src/connection-adapters/schema-cache.ts)
  — backs the sync `Model.columnsHash()` / `attributes.ts` `_defaultAttributes`.
- `getCachedDataSourceExists` — backs the sync `cachedTableExists`.
- `getCachedPrimaryKeys` — backs the sync `Model.primaryKey`.
- `setColumns` — the sync write half that makes the three readers answerable
  query-free; Rails populates only through `add(pool, table_name)`.
- `eagerLoadSchemaCache` — opt-in boot-time introspection warming; Rails has
  only `lazily_load_schema_cache` (a committed dump), because its sync
  accessors can fall back on blocking reflection.

Once the permanent-connection-checkout flip (this RFC) lets those accessors
block, each of the five has nothing left to buy.

## Acceptance criteria

- [ ] The three `getCached*` readers are gone, their callers moved onto the
      Rails-named async accessors (`columnsHash`, `dataSourceExists`,
      `primaryKeys`).
- [ ] `setColumns` is gone; every population path is `add(pool, tableName)`.
- [ ] `eagerLoadSchemaCache` is gone, leaving only `lazilyLoadSchemaCache`.
- [ ] No `@noRailsEquivalent` tag and no `@internal` sync-shim marker remains
      in `connection-adapters/schema-cache.ts` for these members.
