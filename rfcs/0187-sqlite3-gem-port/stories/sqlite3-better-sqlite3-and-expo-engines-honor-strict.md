---
title: "sqlite3: better-sqlite3 and expo engines honor strict (DQS off)"
status: ready
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The gem's `Database#initialize` calls `disable_quirk_mode` when `strict: true` is passed (`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb:168-170`). In the C extension, `disable_quirk_mode` (`ext/sqlite3/database.c`) runs `sqlite3_db_config(db, SQLITE_DBCONFIG_DQS_DDL, 0)` and `SQLITE_DBCONFIG_DQS_DML, 0`. trails#10551 converged the node:sqlite engine. The better-sqlite3 engine (`packages/sqlite3/lib/engine/better-sqlite3.ts`) and the expo engine (`lib/engine/expo-sqlite.ts`) still answer `disableQuirkMode: () => {}`, so `strict: true` over either of them still accepts `SELECT "nope"`.

## Acceptance criteria

- [ ] `strict: true` over the better-sqlite3 engine rejects `SELECT "nope"` with `SQLite3::SQLException`. better-sqlite3 has no DQS option, so one way is a build compiled with `SQLITE_DQS=0`. Otherwise, find which runtime path is available and use it.
- [ ] The same holds over the expo engine, or a documented limit is ruled by the operator.
- [ ] Tests in `engine-better-sqlite3.trails.test.ts` and `engine-expo-sqlite.trails.test.ts`.
