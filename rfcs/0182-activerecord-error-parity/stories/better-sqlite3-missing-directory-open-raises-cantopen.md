---
title: "activerecord: a better-sqlite3 open under a missing directory raises SQLite3::CantOpenException"
status: done
updated: 2026-10-06
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8593
claim: "2026-10-06T19:03:14Z"
assignee: "marshalling-methods-bodies-are-not-arm-compared"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Database.new` reports every failed open through `rb_sqlite3_raise`
(`vendor/sqlite3/v2.6.0/ext/sqlite3/exception.c:38`), so a database path whose
parent directory does not exist raises `SQLite3::CantOpenException`
(`unable to open database file`).

The better-sqlite3 npm client checks the directory itself before it calls
SQLite, and throws a plain `TypeError` with no `code`:
`Cannot open database because the directory does not exist` (measured against
the installed client: `new Database("/nonexistent-dir/a.db")`). `rbSqlite3Raise`
(`packages/activerecord/src/sqlite/errors.ts`) finds no status and rethrows it,
so `openDatabase` in `packages/activerecord/src/sqlite/better-sqlite3.ts` lets
a `TypeError` escape where the gem raises `CantOpenException`. A `file:` URI
skips the client's check and does raise `SQLITE_CANTOPEN`.

Reach is narrow: `SQLite3Adapter#initialize` (`sqlite3_adapter.rb:117-127`)
`mkdir_p`s the directory first, so it needs the directory removed before
connect, or a direct driver open. Found while converging
`SQLite3Adapter.new_client`'s rescue (trails#8582).

## Acceptance criteria

- [ ] `betterSqlite3Driver.open` / `openSync` on a path under a missing
      directory raises `SQLite3::CantOpenException` with code 14 and message
      `unable to open database file`.
- [ ] A test in `better-sqlite3.trails.test.ts` pins it.
