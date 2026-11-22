---
title: "sqlite3: node:sqlite engine honors strict (DQS off) and open_v2 without CREATE"
status: in-progress
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10551
claim: "2026-11-22T03:48:33Z"
assignee: "sqlite3-better-sqlite3-engine-binds-numbered-params"
blocked-by: null
closed-reason: null
---

## Context

The gem's `Database#initialize` calls `disable_quirk_mode` when it is given `strict: true` (`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb`, `if options[:strict]`). The C side (`ext/sqlite3/database.c`, `disable_quirk_mode`) runs `sqlite3_db_config(db, SQLITE_DBCONFIG_DQS_DDL, 0)` and `SQLITE_DBCONFIG_DQS_DML, 0` on the open handle.

In `packages/sqlite3/lib/engine/node-sqlite.ts`, `disableQuirkMode` is a no-op and `open` always passes `enableDoubleQuotedStringLiterals: true`. node:sqlite can only set DQS when the database is opened, through `DatabaseSync` options. So `new SQLite3.Database(f, { engine, strict: true })` still accepts double-quoted string literals. better-sqlite3 and expo-sqlite also leave it a no-op.

The open mode also has a gap: `open_v2` without `SQLITE_OPEN_CREATE` must fail on a missing file. The node:sqlite engine always creates the file. The better-sqlite3 engine maps this to `fileMustExist`.

## Acceptance criteria

- [ ] `strict: true` over the node:sqlite engine rejects `SELECT "nope"` with `SQLite3::SQLException`. For example, `Database` could hand `strict` to `EngineOpenV2` so the engine can set DQS when it opens. Alternatively, `disableQuirkMode` could reopen the handle with DQS off.
- [ ] `flags: READWRITE` without `CREATE` on a missing path raises `CantOpenException` (for example, through a `file:` URI with `mode=rw`).
- [ ] A test in `engine-node-sqlite.trails.test.ts` covers each.
