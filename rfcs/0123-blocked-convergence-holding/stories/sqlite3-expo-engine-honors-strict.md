---
title: "sqlite3-expo-engine-honors-strict"
status: blocked
updated: 2026-11-22
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "upstream: expo-sqlite exposes no DQS open option or sqlite3_db_config"
closed-reason: null
---

## Context

The gem's `Database#initialize` calls `disable_quirk_mode` under `strict: true`
(`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb:168-170`), which runs
`sqlite3_db_config(db, SQLITE_DBCONFIG_DQS_DDL/DML, 0)` (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c:165-180`).
The expo engine (`packages/sqlite3/lib/engine/expo-sqlite.ts`) answers `disableQuirkMode: () => {}`.
expo-sqlite's `openDatabaseAsync(name, options)` takes no DQS option and exposes no `sqlite3_db_config`,
so there is no runtime path today. Split from `sqlite3-better-sqlite3-and-expo-engines-honor-strict`,
whose better-sqlite3 half needed only a test: better-sqlite3 is compiled `SQLITE_DQS=0`
(`PRAGMA compile_options` answers `DQS=0`).

## Acceptance criteria

- [ ] `strict: true` over the expo engine rejects `SELECT "nope"` with `SQLite3::SQLException`, through an expo-sqlite API that sets DQS, or the limit is ruled by the operator.
- [ ] A test in `packages/sqlite3/test/engine-expo-sqlite.trails.test.ts`.
