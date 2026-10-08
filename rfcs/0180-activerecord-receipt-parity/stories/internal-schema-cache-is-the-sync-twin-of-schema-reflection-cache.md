---
title: "activerecord: internalSchemaCache is the sync twin of the ported SchemaReflection#cache, not a ratified peek"
status: done
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: convergeable
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8681
claim: "2026-10-08T14:35:12Z"
assignee: "internal-schema-cache-is-the-sync-twin-of-schema-reflection-cache"
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter#internalSchemaCache`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:2114`) is a
synchronous getter that reads `pool.schemaReflection.loadedCache` and seats a
fresh `SchemaCache` on it when absent.

**It has a Rails counterpart, and trails already ports it.** Rails'
`SchemaReflection#cache(pool)` is private and reads

```ruby
def cache(pool)
  @cache ||= load_cache(pool) || empty_cache
end
```

(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:106-108`),
ported as the private async `SchemaReflection#cache`
(`packages/activerecord/src/connection-adapters/schema-cache.ts:177-181`).

So `internalSchemaCache` is the **synchronous twin of that async method**, with
Rails' `load_cache(pool)` arm dropped — it seats `emptyCache()` where Rails
would first try the schema-cache dump. It is not Rails'
`AbstractAdapter#schema_cache` (`abstract_adapter.rb:298-299`), which returns a
`BoundSchemaReflection` and is separately and faithfully ported as
`schemaCache` (`abstract-adapter.ts:1064`); the two differ in return type and in
Rails counterpart, so this is not a second spelling to collapse.

It is also **not** covered by CLAUDE.md § "Schema reflection peeks at a warm
cache". That section ratifies readers that "read or seed the memo maps and never
query" — `getCachedColumnsHash`, `getCachedDataSourceExists`,
`getCachedPrimaryKeys`, `setColumns`, `SchemaReflection#loadedCache`. Dropping
`load_cache(pool)` is omitting a query Rails makes, not peeking a warm memo, and
the section's Scope boundary explicitly declines to bless the sync twins of
async reflection. It was briefly promoted to `PERMANENT` against that section in
trails#8651 and reverted in the same PR once `SchemaReflection#cache` was found.

**This supersedes a closed story whose premise is falsified.**
`delete-the-internal-schema-cache-accessor` (RFC 0123) was closed with
"Premise gone: ... the sync readers of internalSchemaCache stay by design and
the getter will not be deleted", on the basis that the owning story's AC
"re-cites internalSchemaCache PERMANENT against that section". Both halves are
now wrong: the PERMANENT re-cite was reverted in trails#8651, and the getter has
a Rails counterpart to converge onto. That closed-reason is DB-owned and left as
it is; this story carries the corrected premise. Do not cite it to close this
one.

## Acceptance criteria

- `internalSchemaCache`'s callers reach the cache through the ported
  `SchemaReflection#cache` (or an `@internal` sync seam on `SchemaReflection`
  named for Rails' `cache`), and the adapter-side getter is deleted.
- The async callers (`model-schema.ts:628` `loadSchemaFromAdapter`,
  `support/schema-cache-dump.ts:32`, `test-fixtures/with-transactional-fixtures.ts:19,38`)
  await `cache(pool)` and no longer seat an `emptyCache()` that skips Rails'
  `load_cache` arm.
- The sync peek callers (`model-schema.ts:742` `loadSchemaFromCacheSync`,
  `attribute-methods/primary-key.ts:128` `getPrimaryKey`) read a warm memo
  through a reader § "Schema reflection peeks at a warm cache" already
  ratifies, and answer `undefined` cold as that section prescribes.
- No receipt in `packages/activerecord/src` cites
  `internal-schema-cache-is-the-sync-twin-of-schema-reflection-cache`.
- `pnpm parity:api:extra:gate` is green (activerecord is rowless).
