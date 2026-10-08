---
title: "Delete SqliteDriver, SqliteConnection, SqliteStatement and their Sync twins"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: migration
packages: ["activerecord", "sqlite3", "website"]
deps:
  [
    "sqlite3-better-sqlite3-engine",
    "sqlite3-node-sqlite-engine",
    "sqlite3-libsql-engines",
    "sqlite3-expo-sqlite-engine",
    "sqlite3-website-sql-js-engine",
    "sqlite3-adapter-perform-query-reads-the-gem-names",
    "sqlite3-adapter-configure-connection-calls-the-gem-setters",
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/sqlite-adapter.ts` declares `SqliteStatement` (`:18`), `SqliteConnection` (`:33`),
`SyncSqliteStatement` (`:51`), `SyncSqliteConnection` (`:66`), `SqliteOpenConfig` (`:134`),
`SqliteDriverCapabilities` (`:147`) and `SqliteDriver` (`:156`). `parity:api:extra --package
sqlite3` excludes "64 novel `interface` declaration name(s) and member(s)" by kind, which is this.

After the engine and adapter stories nothing implements or calls them.
`SqliteDriverCapabilities` (`inProcessSync`, `streaming`, `loadExtension`,
`concurrentStatements`, `foreignKeysOnByDefault`, `immediateTransactions`) is read by the
adapter to branch on the client; the gem has no such object.

## Acceptance criteria

- [ ] The seven declarations are deleted; `grep -rn "SqliteDriver\|SqliteConnection\|SqliteStatement" packages/ --include=*.ts` returns nothing outside changelogs.
- [ ] Each `capabilities` read in the adapter is listed in the PR body with what replaces it: a gem call that already answers it, an engine-private behaviour, or a new story (`pnpm tasks new`) where the branch is a real client difference the adapter must still see.
- [ ] `pnpm parity:api:extra --package sqlite3` reports 0 novel and its "excluded by kind" count for the package is 0 or names only the engine interface.
- [ ] `sqlite-driver-adapter-subclasses-carry-file-level-covers` (RFC 0180) is re-read against the result and its context updated by markdown PR if this changed what it describes.

## Verification

```bash
pnpm parity:api:extra --package sqlite3 && pnpm test:types
```
