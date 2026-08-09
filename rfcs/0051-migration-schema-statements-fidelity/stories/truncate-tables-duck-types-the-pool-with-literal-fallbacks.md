---
title: "truncateTables duck-types pool.schemaMigration/internalMetadata and falls back to literals"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6264
claim: "2026-08-08T21:45:04Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: null
closed-reason: null
---

## Context

`truncateTables` (`connection-adapters/abstract/database-statements.ts:748-749`)
reads its two internal table names through duck-type probes with string
fallbacks:

```ts
const schemaMigrationTable = this.pool?.schemaMigration?.tableName ?? "schema_migrations";
const internalMetadataTable = this.pool?.internalMetadata?.tableName ?? "ar_internal_metadata";
```

Rails sends both bare
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:222-223`):

```ruby
def truncate_tables(*table_names)
  table_names -= [pool.schema_migration.table_name, pool.internal_metadata.table_name]
```

so a pool-less adapter raises NoMethodError rather than truncating against
hardcoded defaults. Ruby's `NullPool` (`abstract/connection_pool.rb:24-48`)
defines neither `schema_migration` nor `internal_metadata`.

The hardcoded literals are the second half of the deviation: they duplicate
names that only `SchemaMigration`/`InternalMetadata` own, so a suite that
renames either keeps truncating the wrong table.

## Converged shape

- `truncateTables` reads `this.pool.schemaMigration.tableName` and
  `this.pool.internalMetadata.tableName` bare, with no fallback literal.
- Callers reaching it with a pool-less adapter get a real `ConnectionPool`
  (`support/pooled-sqlite-adapter.ts`), never a re-added NullPool member.

## Acceptance criteria

- [ ] No `?.` probe and no `"schema_migrations"` / `"ar_internal_metadata"`
      literal in the body.
- [ ] A pool-less adapter raises NoMethodError, as in Ruby.
- [ ] No new baseline rows or allowlist entries.
