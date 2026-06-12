---
title: "SQLite adapter subclasses (Node/Expo) + retire driver registry"
status: in-progress
updated: 2026-06-12
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: ["abstract-sqlite3-adapter"]
deps-rfc: []
est-loc: 250
priority: 10
pr: 3142
claim: "2026-06-12T01:07:59Z"
assignee: "sqlite3-adapter-subclasses-registry-removal"
blocked-by: null
---

## Context

Second of two PRs for the SQLite driver-abstraction Rails-fication. PR #3120
(story `abstract-sqlite3-adapter`) introduced `AbstractSQLite3Adapter` (all
shared dialect/quoting/schema logic) and a thin `BetterSQLite3Adapter` subclass
bound to the better-sqlite3 client lib via the `defaultSqliteDriver()` hook. The
`sqlite3` adapter name now resolves to `BetterSQLite3Adapter`. (Note the
capital-SQL casing — matches the existing `SQLiteDateTimeType` / `SQLite3Integer`
and lets `api:compare` map Rails `SQLite3Adapter` via its `Abstract<X>`
convention.)

That first PR deliberately kept the legacy driver registry
(`registerSqliteDriver()` / `getSqlite()` / `AR_SQLITE_DRIVER`) in place, and
left `SQLite3Adapter` as a thin alias of the abstract base.

**No backwards compatibility is required — the project is pre-release.** Remove
the alias outright and migrate every reference to the real class; do NOT keep a
compat shim.

This story finishes the job:

- Add thin `NodeSQLiteAdapter` and `ExpoSQLiteAdapter` subclasses of
  `AbstractSQLite3Adapter`, each overriding `defaultSqliteDriver()` to return
  its bundled driver — mirror `connection-adapters/better-sqlite3-adapter.ts`.
  Do NOT clone adapter logic; the abstract base holds all dialect.
- Register them by `adapter:` name in `connection-adapters.ts`.
- Remove `registerSqliteDriver()` / `getSqlite()` / `getSqliteAsync()` /
  `clearSqliteDrivers()` / `AR_SQLITE_DRIVER` and the globalThis registry from
  `sqlite-adapter.ts`.
- Delete the `export { AbstractSQLite3Adapter as SQLite3Adapter }` alias and
  migrate every `SQLite3Adapter` reference (~373 sites: trailties `database.ts`,
  test helpers, test files) to the concrete `BetterSQLite3Adapter` (for
  `new SQLite3Adapter(...)` / `instanceof` runtime sites) or
  `AbstractSQLite3Adapter` (for base-class type annotations). This is a single
  mechanical rename — note it in the PR body per CLAUDE.md. Driver-wrapper unit
  tests stay in the `sqlite-drivers` vitest project.
- Update `sqlite-adapter.test.ts` (registry tests) accordingly.

The mechanical alias rename alone may exceed the 300 LOC ceiling; if so, split
it into its own story (mechanical-rename exception) ahead of the
NodeSQLite/ExpoSQLite + registry-removal work rather than fanning out PRs.

## Acceptance criteria

- [ ] `NodeSQLiteAdapter` / `ExpoSQLiteAdapter` are thin subclasses of
      `AbstractSQLite3Adapter` registered by `adapter:` name
- [ ] `registerSqliteDriver()` / `getSqlite()` / `AR_SQLITE_DRIVER` removed
- [ ] `SQLite3Adapter` alias removed entirely (no compat shim); all call sites
      migrated to `BetterSQLite3Adapter` / `AbstractSQLite3Adapter`
- [ ] All SQLite tests pass; `api:compare` delta non-negative
