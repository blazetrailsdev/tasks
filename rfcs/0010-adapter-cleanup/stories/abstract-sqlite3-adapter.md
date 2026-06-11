---
title: "Rails-fy SQLite driver abstraction: AbstractSqlite3Adapter + per-lib subclasses"
status: done
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 400
priority: 10
pr: 3120
claim: "2026-06-11T13:05:21Z"
assignee: "abstract-sqlite3-adapter"
blocked-by: null
---

## Context

PR #2905 relocated the SQLite driver abstraction from activesupport → activerecord,
but kept the custom "driver registry" design (`registerSqliteDriver` / `getSqlite` /
`AR_SQLITE_DRIVER`). Rails has no driver concept — it models "one DB, multiple
client libs" as thin adapter subclasses over an abstract base
(`AbstractMysqlAdapter` + `Mysql2Adapter` / `TrilogyAdapter`).

Planned follow-up: introduce `AbstractSqlite3Adapter` (all shared SQLite
dialect/quoting/schema logic, already in `connection-adapters/sqlite3/`) +
`BetterSqlite3Adapter` / `NodeSqliteAdapter` / `ExpoSqliteAdapter` subclasses,
registered by `adapter:` name in `connection-adapters.ts` (`sqlite3` defaults to
BetterSqlite3). Retire the `registerSqliteDriver()` / `getSqlite()` /
`AR_SQLITE_DRIVER` registry.

Split into at least two PRs: abstract base + BetterSqlite3 first; remaining two
adapters second. Do NOT clone the full adapter per backend — abstract base holds
all shared dialect.

**Gotcha (test infra):** driver wrapper unit tests run in the `sqlite-drivers`
vitest project (setup-free), excluded from `activerecord`. Keep them there.

## Acceptance criteria

- [ ] `AbstractSqlite3Adapter` introduced with shared SQLite logic
- [ ] `BetterSqlite3Adapter` / `NodeSqliteAdapter` / `ExpoSqliteAdapter` are thin subclasses
- [ ] Registered by `adapter:` name; `sqlite3` defaults to BetterSqlite3
- [ ] `registerSqliteDriver()` / `getSqlite()` / `AR_SQLITE_DRIVER` removed
- [ ] All SQLite tests pass; `api:compare` delta non-negative
