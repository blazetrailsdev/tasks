---
title: "retire-pg-sqlite-get-database-version-memo-guards"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6241
claim: "2026-08-08T15:39:54Z"
assignee: "retire-pg-sqlite-get-database-version-memo-guards"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `port-pool-server-version-retire-get-database-version-memo-guard`
(shipped in the same PR as the MySQL half). That story moved the MySQL version
memo onto the pool: `PoolConfig#serverVersion` / `NullPool#serverVersion` are
now the single cache (`pool_config.rb:39-41`,
`abstract/connection_pool.rb:30-32`) and `AbstractAdapter#databaseVersion` reads
`this.pool.serverVersion(this)` (`abstract_adapter.rb:854-856`).

PostgreSQL and SQLite still carry the pushed-down memo the MySQL adapter shed:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:443`
  declares `_databaseVersion`; `getDatabaseVersion` (3238) opens with
  `if (this._databaseVersion !== null) return this._databaseVersion;`, assigns
  the field, and additionally warms `_hasOptimizerHints` — none of which is in
  `postgresql_adapter.rb:635-643`, which is a bare
  `with_raw_connection { |conn| ... conn.server_version }`. The
  `databaseVersion` getter (3285) reads the field instead of the pool.
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1452`
  declares `_databaseVersion`, pre-warmed by `connect()`;
  `getDatabaseVersion` (1454) returns the field and `databaseVersion` (1459)
  delegates to `getDatabaseVersion`, bypassing the pool.
  `sqlite3_adapter.rb:476-478` is a pure
  `Version.new(@raw_connection.libversion_string)`.

Baseline rows for `get_database_version` exist in
`call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql-adapter.json`
and `sqlite3-adapter.json`; they should shrink with this convergence.

## Acceptance criteria

- [ ] `PostgreSQLAdapter#getDatabaseVersion` is the pure fetch of
      `postgresql_adapter.rb:635-643` — no leading memo guard, no field
      assignment; the `_hasOptimizerHints` warm moves to its own caller or stays
      justified at its call site.
- [ ] `SQLite3Adapter#getDatabaseVersion` is the pure derivation of
      `sqlite3_adapter.rb:476-478`.
- [ ] Neither adapter overrides `databaseVersion` with a field read; both go
      through `AbstractAdapter#databaseVersion` → `pool.serverVersion`.
- [ ] `_databaseVersion` is gone from both adapters.
- [ ] Stale `get_database_version` baseline rows deleted, not reseeded.
- [ ] PG and SQLite lanes green.
