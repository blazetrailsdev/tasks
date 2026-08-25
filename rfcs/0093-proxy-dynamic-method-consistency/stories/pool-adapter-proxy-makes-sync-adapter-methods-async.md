---
title: "Pool adapter proxy turns Rails' sync adapter methods into Promises"
status: draft
updated: 2026-08-01
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ConnectionPool#_getAdapterProxy` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:483-521`)
fabricates a dispatcher for every member name a real connection exposes as a
method, and every one of them returns `pool.withConnection(...)` — a Promise.
That silently converts Rails' _synchronous_ adapter methods into async ones for
every pool-backed consumer. Rails has no such object: `SchemaMigration.new(pool)`
/ `InternalMetadata.new(pool)` hold the pool and wrap only the statement
execution in `@pool.with_connection` (`schema_migration.rb:12-17`), leaving
`to_sql`, `quote`, `quote_table_name`, `type_to_sql` etc. plain sync calls.

Found via PR #5805: `SchemaMigration#versions` did
`this._adapter.execute(this._adapter.toSql(sm))`. Against a pool-supplied proxy
`toSql` answered a Promise, `execute` threw on it, and `tableExists`'s bare
`catch` swallowed the throw into a silent "no table" — so
`pool.migrationContext.getAllVersions()` reported nothing migrated and
`assumeMigratedUptoVersion` re-inserted an applied version. #5805 patched the
five `SchemaMigration` call sites with an `await` helper (`_toSql`); the proxy
itself is untouched, so the same trap is live for every other sync adapter
method reached through `pool.schemaMigration` / `pool.internalMetadata` /
`pool.migrationContext`.

## Acceptance criteria

- [ ] Pool-backed consumers reach the adapter's synchronous methods
      synchronously — either by giving `SchemaMigration` / `InternalMetadata`
      the pool (Rails' shape) and confining `withConnection` to statement
      execution, or by having the proxy dispatch sync-return members without
      wrapping.
- [ ] `SchemaMigration._toSql` (the #5805 shim) is deleted and the five call
      sites go back to a plain `toSql`.
- [ ] `SchemaMigration#tableExists` no longer swallows non-"table missing"
      errors into `false` — a programming error surfaces instead of degrading
      into "nothing is migrated".
- [ ] A test covers a sync adapter method (e.g. `quoteTableName` or `toSql`)
      reached through `pool.schemaMigration`, failing on the current proxy.
