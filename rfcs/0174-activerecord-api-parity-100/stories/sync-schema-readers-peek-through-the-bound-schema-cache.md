---
title: "activerecord: sync schema readers peek through schema_cache (BoundSchemaReflection), not schemaReflection.loadedCache"
status: ready
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ModelSchema#load_schema!` reads the columns through the pool's bound
reflection:

```ruby
columns_hash = schema_cache.columns_hash(table_name)
```

(`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:592`),
where `schema_cache` is `connection_pool.schema_cache`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:368-370`),
a `BoundSchemaReflection`. `get_primary_key` and `table_exists?` read the same
object (`attribute_methods/primary_key.rb:109`, `model_schema.rb:417`).

After trails#8681 deleted `AbstractAdapter#internalSchemaCache`, the three sync
readers reach past that object and peek the raw cache directly:

- `loadSchemaFromCacheSync` (`packages/activerecord/src/model-schema.ts`, the
  `pool.schemaReflection.loadedCache` read)
- `cachedTableExists` (same file)
- `cachedSchemaCacheFor` (`packages/activerecord/src/attribute-methods/primary-key.ts`)

Two consequences:

1. Rails' test stubs `Topic.connection_pool.schema_cache`
   (`vendor/rails/v8.0.2/activerecord/test/cases/base_test.rb:131`). The port in
   `packages/activerecord/src/base.test.ts` has to spy on the pool's
   `schemaReflection` getter instead, because no sync reader goes through
   `pool.schemaCache`.
2. `warmColumnsHashSync` (`model-schema.ts`) is a helper Rails does not have.
   When the reflection has no loaded cache it builds the columns hash from a
   synchronous adapter's `columns` without caching it, so each model re-reads
   the adapter where Rails' `SchemaCache#columns_hash`
   (`connection_adapters/schema_cache.rb:343-355`) memoizes per table. It could
   not seat an empty cache, because that would make the later
   `SchemaReflection#cache(pool)` skip `load_cache` (`schema_cache.rb:106-108`).

## Converged shape

The sync readers call the peek on `klass.schemaCache()` (the pool's
`BoundSchemaReflection`), so the read site spells `schema_cache.…` as Rails
does and the `base_test.rb:131` stub ports as a stub of `pool.schemaCache`.
`BoundSchemaReflection` / `SchemaReflection` forward the peeks CLAUDE.md
§ "Schema reflection peeks at a warm cache" already ratifies on `SchemaCache`
(`getCachedColumnsHash`, `getCachedDataSourceExists`, `getCachedPrimaryKeys`).
`warmColumnsHashSync`'s sync-adapter seed moves behind that forward, so
`loadSchemaFromCacheSync` no longer open-codes it.

## Acceptance criteria

- `loadSchemaFromCacheSync`, `cachedTableExists` and `cachedSchemaCacheFor`
  read through `schemaCache()`, not `schemaReflection.loadedCache`.
- `base.test.ts` ".columns_hash raises an error if the record has an empty
  table name"'s neighbour that stubs the schema cache (Rails
  `base_test.rb:131`) stubs `connectionPool().schemaCache`.
- A synchronous adapter's columns are read once per table, not once per model,
  without seating a cache ahead of `load_cache`.
- No new sync connection lease; `pnpm parity:api:extra:gate` stays green
  (activerecord is rowless, so any forwarded peek carries its receipt).
