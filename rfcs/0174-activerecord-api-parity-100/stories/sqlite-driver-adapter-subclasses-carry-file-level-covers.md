---
title: "activerecord: retire the file-level covers on the six SQLite driver adapter subclasses"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
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

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the six receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

Six files under `packages/activerecord/src/connection-adapters/` open with a file-level `@noRailsEquivalent` cover:

- `better-sqlite3-adapter.ts`, `node-sqlite-adapter.ts`, `expo-sqlite-adapter.ts`, `libsql-adapter.ts` — each a `SQLite3Adapter` subclass whose only member is `static defaultSqliteDriver()`.
- `libsql-remote-adapter.ts` — the same, plus a constructor that moves `database` to `remoteUrl` and an `override supportsConcurrentConnections()` answering `true`.
- `libsql-replica-adapter.ts` — the same, plus `syncReplica()`.

Rails has one class. `SQLite3Adapter.new_client` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:34-42`) opens `::SQLite3::Database.new(config[:database].to_s, config)`, and the adapter is chosen by the `adapter:` key through `ConnectionAdapters.register` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:22-50`). Which client library backs it is not a Rails concept.

A file cover is the widest receipt there is: it allows every name in the file, present and future, without listing one. `sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem` owns the four covers on `packages/activerecord/src/sqlite/*.ts` (the drivers themselves); this story owns the six adapter subclasses that select them.

## Acceptance criteria

- [ ] The six file covers are gone. Driver selection is either one seam on `SQLite3Adapter.newClient` keyed by the registered adapter name, or each subclass's members carry their own per-declaration receipt against a decision that exists.
- [ ] `LibSQLRemoteAdapter`'s `supportsConcurrentConnections` override and `LibSQLReplicaAdapter#syncReplica` are each measured (paired, receipted per declaration, or moved onto the driver).
- [ ] A new export added to any of the six files is scored by `pnpm parity:api:extra`.
- [ ] `pnpm parity:api:extra:gate` (activerecord rowless) and `pnpm parity:api:receipts:gate` green; no mark or baseline widened.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate
```
