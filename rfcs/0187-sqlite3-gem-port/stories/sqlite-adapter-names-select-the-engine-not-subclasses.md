---
title: "sqlite-adapter-names-select-the-engine-not-subclasses"
status: draft
updated: 2026-11-20
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails has one SQLite adapter class. `SQLite3Adapter.new_client`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:34-42`)
opens `::SQLite3::Database.new(config[:database].to_s, config)`, and the class is
chosen by the `adapter:` key through `ConnectionAdapters.register`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:22-50`).

trails registers six adapter names (`packages/activerecord/lib/connection-adapters.ts:90-120`)
onto six classes with no Rails counterpart, each in its own file under
`packages/activerecord/lib/connection-adapters/`:
`BetterSQLite3Adapter`, `NodeSQLiteAdapter`, `ExpoSQLiteAdapter`, `LibSQLAdapter`
(each only `static defaultSqliteDriver()`), `LibSQLRemoteAdapter` (an `AbstractAdapter`
with `SQLite3Adapter` included, a constructor and a `databaseExists` override) and
`LibSQLReplicaAdapter` (plus `syncReplica()`, which calls the libsql handle's `sync`).
`SQLite3Adapter.resolveDriverFactory` (`sqlite3-adapter.ts:1237`) reads
`config.driver`, else `this.defaultSqliteDriver()`.

`sqlite-driver-adapter-subclasses-carry-file-level-covers` retired the file-level cover
on `libsql-replica-adapter.ts` and left each class name and `syncReplica` with a
per-declaration `@noRailsEquivalent CONVERGEABLE` receipt pointing here.

## Acceptance criteria

- [ ] Every SQLite adapter name registers `SQLite3Adapter` (Rails' one class); the engine
      is chosen in `newClient`'s path from the registered adapter name in `config`, so the
      six subclasses and their files are deleted (package.json exports, `namespaces.ts`
      seats, tests and examples move to `adapter:` names).
- [ ] `LibSQLRemoteAdapter`'s constructor and `databaseExists` behaviour live on the libsql
      remote engine in `@blazetrails/sqlite3`, not on an adapter class.
- [ ] `syncReplica` moves onto the libsql replica `Database` in `@blazetrails/sqlite3`
      (reached through `withRawConnection`), not on the adapter.
- [ ] No `@noRailsEquivalent` receipt names this story afterwards; `pnpm parity:api:extra:gate`
      and `pnpm parity:api:receipts:gate` green.
