---
title: "sqlite3: expo engine raises a failed prepare from Database#prepare, with its SQL"
status: done
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10551
claim: "2026-11-22T03:48:33Z"
assignee: "sqlite3-better-sqlite3-engine-binds-numbered-params"
blocked-by: null
closed-reason: null
---

## Context

`packages/sqlite3/lib/engine/expo-sqlite.ts` prepares lazily: the engine's `prepare(sql)` is synchronous (`EngineDatabase.prepare` answers `[EngineStatement, string]`), and `prepareAsync` runs on the first `step` / `columnCount`. So a syntax error raises at the first step, not at `Database#prepare`. The gem raises from `Statement#initialize`'s `prepare` (`vendor/sqlite3/v2.6.0/lib/sqlite3/statement.rb:36-46`, C `prepare` in `ext/sqlite3/statement.c`, `CHECK_PREPARE` → `rb_sqlite3_raise_with_sql`). The error also loses its `sql`: it surfaces through `rbSqlite3Raise`, not `rbSqlite3RaiseWithSql`.

## Acceptance criteria

- [ ] A failed prepare on expo raises `SQLite3::SQLException` carrying `sql`, from `Database#prepare`. Under RFC 0187's union rule (open question 1) that means `prepare` answers a promise on expo, or `EngineDatabase.prepare` may return `Promise<[EngineStatement, string]>` and `Statement`'s constructor work moves to a `static async new` (CLAUDE.md § "Every promise has an owner").
- [ ] A test pins `db.prepare("SELECT * FROM nope")` rejecting with `sql === "SELECT * FROM nope"` on the expo engine.
