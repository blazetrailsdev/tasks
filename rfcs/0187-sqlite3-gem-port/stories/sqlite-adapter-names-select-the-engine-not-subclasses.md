---
title: "activerecord: retire the six SQLite adapter subclasses; every SQLite adapter name registers SQLite3Adapter"
status: in-progress
updated: 2026-11-21
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: ["activerecord", "sqlite3"]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: trails#10469
claim: "2026-11-21T01:35:30Z"
assignee: "sqlite-adapter-names-select-the-engine-not-subclasses"
blocked-by: null
closed-reason: null
---

## Context

Rails has one SQLite adapter class. `SQLite3Adapter.new_client`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:34-42`)
opens `::SQLite3::Database.new(config[:database].to_s, config)`, and the class is chosen
by the `adapter:` key through `ConnectionAdapters.register`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:22-50`).

`sqlite-driver-adapter-subclasses-carry-file-level-covers` (trails#10457) moved engine
selection onto `SQLite3Adapter.resolveDriverFactory`
(`packages/activerecord/lib/connection-adapters/sqlite3-adapter.ts`), keyed by
`config.adapter` (`sqlite3` by default). The subclasses no longer pick a driver, but they
still exist, each with a class-name receipt pointing here:

- `BetterSQLite3Adapter`, `NodeSQLiteAdapter`, `ExpoSQLiteAdapter`, `LibSQLAdapter`: empty
  `SQLite3Adapter` subclasses, registered at `packages/activerecord/lib/connection-adapters.ts:90-110`
  and exported from `packages/activerecord/package.json`. About 150 test sites construct
  `new BetterSQLite3Adapter(...)`.
- `LibSQLRemoteAdapter`: an `AbstractAdapter` with `SQLite3Adapter` included, a constructor
  that sets `_memoryDatabase = false` and skips the local-path handling, and an override of
  `databaseExists`.
- `LibSQLReplicaAdapter`: `SQLite3Adapter` plus `syncReplica()`, which calls the libsql
  handle's `sync`.

## Acceptance criteria

- [ ] Every SQLite adapter name registers `ActiveRecord::ConnectionAdapters::SQLite3Adapter`.
      The four empty subclasses, their files, package exports and `namespaces.ts` seats are
      deleted, and their tests and examples construct `SQLite3Adapter` with an `adapter:` key.
- [ ] The remote constructor's behaviour and its `databaseExists` live on the libsql remote
      engine in `@blazetrails/sqlite3`, and `LibSQLRemoteAdapter` is deleted.
- [ ] `syncReplica` moves onto the libsql replica `Database` in `@blazetrails/sqlite3`,
      reached through `withRawConnection`, and `LibSQLReplicaAdapter` is deleted.
- [ ] No receipt names this story afterwards. `pnpm parity:api:extra:gate` and
      `pnpm parity:api:receipts:gate` are green.
