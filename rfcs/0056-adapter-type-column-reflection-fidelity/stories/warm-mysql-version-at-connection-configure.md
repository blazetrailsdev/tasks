---
title: "Warm MySQL server version at connection-configure time so isMariadb() isn't cold"
status: claimed
updated: 2026-07-08
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 31
pr: null
claim: "2026-07-08T21:52:34Z"
assignee: "warm-mysql-version-at-connection-configure"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #4718 (converge-mysql-columns-show-full-fields). Converging
`Mysql2Adapter#columns` onto `SHOW FULL FIELDS` removed the retired
information_schema `columns()` path, which awaited `getFullVersion()`
unconditionally on every table reflection (PR #4197). That call populated
`_mariadb` / `_databaseVersion` as a side effect (`mysql2-adapter.ts:1730-1736`),
so `isMariadb()` was effectively always warm by the time callers gated on it.

Removing it left `isMariadb()` cold on a freshly leased connection (returns the
default `false` until some code awaits `getFullVersion()`), which broke
version-conditional test skips (`ctx.skip(isMariadb())`). PR #4718 patched this
by adding `await this.getDatabaseVersion()` at the top of
`AbstractMysqlAdapter#columns` (`abstract-mysql-adapter.ts` ~line 205) — a
band-aid that re-couples version warming to column reflection.

Rails does not do this. Rails fetches `database_version` eagerly during
connection configuration (`configure_connection` / `get_database_version` on
connect), so `mariadb?` / `database_version` are reliably available without any
reflection call. See
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`
(`configure_connection`, `get_database_version`) and the abstract
`AbstractAdapter#get_database_version` contract.

## Acceptance criteria

- [ ] MySQL/MariaDB server version (and thus `_mariadb` / `isMariadb()`) is
      warmed at connection-configure time (on connect / first checkout), mirroring
      Rails' eager `get_database_version`, rather than lazily on first
      `getFullVersion()`.
- [ ] The band-aid `await this.getDatabaseVersion()` at the top of
      `AbstractMysqlAdapter#columns` is removed once the eager warm makes it
      redundant.
- [ ] `isMariadb()` returns the correct value on a fresh lease with no prior
      reflection call — verify the `store.test.ts` MariaDB `ctx.skip(isMariadb())`
      path still skips correctly, and no regression across MySQL 8 / MariaDB
      introspection suites.
