---
title: "retire-pg-database-version-override"
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
pr: 6237
claim: "2026-08-08T14:27:54Z"
assignee: "retire-pg-database-version-override"
blocked-by: null
closed-reason: null
---

## Context

Split out of `retire-sqlite3-and-pg-database-version-overrides` (trails PR for the
sqlite half). That story retired `SQLite3Adapter#databaseVersion` and its
`_databaseVersion` field: SQLite's `getDatabaseVersion()` is now the pure fetch
Rails has (`sqlite3_adapter.rb:476-478`) and the narrowing rides on a
declaration-merged `export interface SQLite3Adapter { get databaseVersion(): Version }`.

The PostgreSQL half did not converge and is carved out here.
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` still has:

- `private _databaseVersion: number | null` (`:443`)
- the fill in `_maybeConfigureConnection` (`:769-781`), issued directly on the
  raw `client` because `getDatabaseVersion()` acquires its own client and would
  re-enter the acquire machinery while `_acquiring` is held
- the memo read/write in `getDatabaseVersion()` (`:3250-3265`)
- the `databaseVersion` getter override (`:3296-3302`), which Rails does not
  have (`abstract_adapter.rb:854-856` is `pool.server_version(self)`)

**Why it did not converge with SQLite.** SQLite converges because its
`configureConnection` calls `super.configureConnection()`
(`abstract-adapter.ts:2559-2571`), which warms the pool memo through
`pool.serverVersion(this)`. PG's `configureConnection` override
(`postgresql-adapter.ts:3054-3057`) deliberately does not — it cannot call
`getDatabaseVersion()` from inside the acquire stack. Warming the memo from the
raw client instead needs a _writer_ reachable from the adapter:
`PoolConfig#setServerVersion` exists (Rails' `attr_writer :server_version`,
`pool_config.rb:9`) but `ConnectionPool` does not delegate one and `NullPool`
(`connection_pool.rb:14-51`) has none in Rails at all — and PG adapters run on
`NullPool` in many tests, where an unwarmed memo makes every sync
`databaseVersion` gate (`:3326`, `:3374`, `:3443`, …) throw. Adding a writer to
`NullPool` would be novel surface, i.e. trading one invention for another.

As the parent story notes, this should be sequenced against
`make-version-gated-predicates-async`: once the version can be fetched on demand,
the sync-getter constraint that forces the hand-warm relaxes and the field can go.

## Acceptance criteria

- [ ] `PostgreSQLAdapter#databaseVersion` and `_databaseVersion` are gone; the
      narrowing to `number` rides on declaration merging as MySQL's (#6150) and
      SQLite's do.
- [ ] `getDatabaseVersion()` is a pure fetch (`postgresql_adapter.rb:635-639`);
      the PoolConfig memo is the only cache.
- [ ] No new `@noRailsEquivalent` tag and no new writer on `NullPool` in its place.
- [ ] `postgresql-adapter.trails.test.ts:1344,1408` and
      `postgresql-adapter.test.ts:201,212` stop poking the private field.
- [ ] pg lane green.
