---
title: "SQLite adapter subclasses (Node/Expo) + retire driver registry"
status: draft
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: ["abstract-sqlite3-adapter"]
deps-rfc: []
est-loc: 250
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Second of two PRs for the SQLite driver-abstraction Rails-fication. PR #3120
(story `abstract-sqlite3-adapter`) introduced `AbstractSqlite3Adapter` (all
shared dialect/quoting/schema logic) and a thin `BetterSqlite3Adapter` subclass
bound to the better-sqlite3 client lib via the `defaultSqliteDriver()` hook. The
`sqlite3` adapter name now resolves to `BetterSqlite3Adapter`.

That first PR deliberately kept the legacy driver registry
(`registerSqliteDriver()` / `getSqlite()` / `AR_SQLITE_DRIVER`) in place for
backward compatibility, and left `SQLite3Adapter` as an alias of the abstract
base.

This story finishes the job:

- Add thin `NodeSqliteAdapter` and `ExpoSqliteAdapter` subclasses of
  `AbstractSqlite3Adapter`, each overriding `defaultSqliteDriver()` to return
  its bundled driver — mirror `connection-adapters/better-sqlite3-adapter.ts`.
  Do NOT clone adapter logic; the abstract base holds all dialect.
- Register them by `adapter:` name in `connection-adapters.ts`.
- Remove `registerSqliteDriver()` / `getSqlite()` / `getSqliteAsync()` /
  `clearSqliteDrivers()` / `AR_SQLITE_DRIVER` and the globalThis registry from
  `sqlite-adapter.ts`.
- Migrate the remaining `SQLite3Adapter` alias call sites (trailties
  `database.ts`, test helpers, ~370 references) to `BetterSqlite3Adapter` /
  `AbstractSqlite3Adapter` and drop the alias. Driver-wrapper unit tests stay in
  the `sqlite-drivers` vitest project.
- Update `sqlite-adapter.test.ts` (registry tests) accordingly.

Likely needs splitting again if the call-site migration pushes past the 300 LOC
ceiling — register a further story rather than fanning out PRs.

## Acceptance criteria

- [ ] `NodeSqliteAdapter` / `ExpoSqliteAdapter` are thin subclasses of
      `AbstractSqlite3Adapter` registered by `adapter:` name
- [ ] `registerSqliteDriver()` / `getSqlite()` / `AR_SQLITE_DRIVER` removed
- [ ] `SQLite3Adapter` alias removed; call sites migrated
- [ ] All SQLite tests pass; `api:compare` delta non-negative
