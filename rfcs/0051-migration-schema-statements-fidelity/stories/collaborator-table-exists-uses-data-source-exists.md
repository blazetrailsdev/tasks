---
title: "SchemaMigration/InternalMetadata tableExists probe with SELECT 1 and swallow every error instead of data_source_exists?"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6249
claim: "2026-08-08T17:27:58Z"
assignee: "collaborator-queries-use-select-values-insert-delete"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `SchemaMigration` / `InternalMetadata` onto a pool in
PR #6239 (`migration-collaborators-hold-a-pool-and-reach-connections-through-it`).
The bodies were moved onto `withConnection`; the `tableExists()` probe itself was
left alone and is still a trails invention.

Rails asks the adapter (or the schema cache) directly:

```ruby
# schema_migration.rb:100-104
def table_exists?
  @pool.with_connection do |connection|
    connection.data_source_exists?(table_name)
  end
end

# internal_metadata.rb:108-110
def table_exists?
  @pool.schema_cache.data_source_exists?(table_name)
end
```

trails runs a `SELECT 1 FROM <table> LIMIT 1` through an Arel `SelectManager`
and wraps it in a bare `catch { return false }`
(`packages/activerecord/src/schema-migration.ts` `tableExists`,
`packages/activerecord/src/internal-metadata.ts` `tableExists`).

Two problems with the catch-all, beyond the naming divergence:

1. **It cannot distinguish "no such table" from any other failure.** PR #6239
   fixed a case where the pool's adapter proxy made `toSql` answer a Promise,
   `execute` rejected with `TypeError: Expected first argument to be a string`,
   and `tableExists()` reported a clean `false`. The proxy is off this path now,
   but the swallow that turned a type error into a wrong answer is still there
   and will hide the next one the same way.
2. **It bypasses the schema cache** that `internal_metadata.rb:109` reads
   through, so every call is a round trip.

`data_source_exists?` already exists on the adapter — RFC 0051's
`table-exists-route-through-data-source-sql` and
`data-source-exists-notimplementederror-fallback` are both `done`.

## Converged shape

```ts
async tableExists(): Promise<boolean> {
  return await this._withConnection((connection) => connection.dataSourceExists(this.tableName));
}
```

for `SchemaMigration`, and the `schemaCache.dataSourceExists(tableName)` read for
`InternalMetadata` (`internal_metadata.rb:109` goes through `@pool.schema_cache`,
not `with_connection` — keep that difference, Rails has it deliberately).

The `try`/`catch` goes away with the probe. Check the call sites first: some
callers may be leaning on the swallow to mean "table absent" where the real
answer is an error they should see.

## Acceptance criteria

- [ ] `SchemaMigration#tableExists` is `data_source_exists?` through
      `withConnection` (`schema_migration.rb:100-104`).
- [ ] `InternalMetadata#tableExists` reads `pool.schemaCache.dataSourceExists`
      (`internal_metadata.rb:108-110`).
- [ ] No bare `catch` swallowing an arbitrary failure into `false` in either.
- [ ] The `table_exists?`/`data_source_exists?`/`schema_cache` call-mismatch
      baseline rows for both files are deleted, not rewritten.
