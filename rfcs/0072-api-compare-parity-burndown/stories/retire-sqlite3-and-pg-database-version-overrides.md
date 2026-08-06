---
title: "Retire the SQLite3 and PostgreSQL databaseVersion overrides and their private memo fields"
status: ready
updated: 2026-08-06
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6150 deleted `AbstractMysqlAdapter#databaseVersion` — a TS-only override whose
body was `super.databaseVersion as Version`, existing solely to narrow the base
getter's `Version | number`. Rails has no such override: `abstract_adapter.rb:854-856`
answers whatever `get_database_version` returned, and each adapter's
`get_database_version` fixes the type. The narrowing now rides on a
declaration-merged `export interface AbstractMysqlAdapter { get databaseVersion(): Version; }`
in `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`.

The same invented override still stands on two other adapters, where
`api:extra --package activerecord` counts `databaseVersion` as novel surface:

- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1452-1457` —
  a private `_databaseVersion` field plus an override returning
  `this._databaseVersion ?? new Version("0.0.0")`. Rails' SQLite3Adapter
  (`sqlite3_adapter.rb`) has only `get_database_version`; the pool memo
  (`pool_config.rb:39-41`) is the cache, not a per-adapter field.
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts` — same
  shape over `_databaseVersion` (see `postgresql-adapter.trails.test.ts:1344,1408`
  and `postgresql-adapter.test.ts:201,212`, which poke the field directly).
  Rails' `postgresql_adapter.rb` has no `database_version` either.

Note `database-version-sync-getter-forces-hand-warms` (in-progress) covers the
async/sync shape of the base getter; this story is only about the two adapter
overrides and their private memo fields, which duplicate the pool memo.

## Converged shape

Delete both overrides and their `_databaseVersion` fields; let the base getter
(`abstract_adapter.rb:854-856` → `pool.server_version(self)`) answer, and narrow
per adapter by declaration merging exactly as #6150 did for MySQL. Update the
tests that reach into `_databaseVersion` to warm/clear the pool memo instead
(`PoolConfig#setServerVersion`, the `attr_writer :server_version` arm from
`pool_config.rb:9`).

## Acceptance criteria

- [ ] `Sqlite3Adapter#databaseVersion` and `PostgreSQLAdapter#databaseVersion`
      are gone, along with their `_databaseVersion` fields.
- [ ] Version gates in both adapters still read their own version type with no
      cast at the call sites.
- [ ] `pnpm api:extra --package activerecord` loses both names; no new
      `@noRailsEquivalent` tag in their place.
- [ ] sqlite3 and pg lanes green.
