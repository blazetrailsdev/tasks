---
title: "the server-version memo is cold at first use because connect drops configureConnection's promise"
status: draft
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while blocking `converge-sql-for-insert-and-supports-insert-returning-to-sync`
in PR #7247 (RFC 0119). That story's converged shape needs
`supports_insert_returning?` to be synchronous, reading a memoized server
version the way Rails does — `AbstractAdapter#database_version` is
`pool.server_version(self)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`),
and `PoolConfig#server_version` is `@server_version ||= connection.get_database_version`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/pool_config.rb`).
Both are plain sync methods, because in Ruby the version probe blocks.

trails memoizes the same value (`pool-config.ts:81`, `abstract/connection-pool.ts:92`),
so the memo is the right shape — but it is not warm when the first statement
runs. `SQLite3Adapter`'s constructor fires `void this.configureConnection()`
(`sqlite3-adapter.ts:290`) without awaiting it, and `configureConnection` is
what reaches `checkVersion()` -> `databaseVersion` -> `pool.serverVersion()`.

Measured, not predicted: making `supportsInsertReturning()` synchronous and
reading `this.databaseVersion` throws
`TypeError: this.databaseVersion.compare is not a function` from
`internal-metadata.ts:192`'s very first `execInsert`, on the SQLite lane — the
getter still holds the un-awaited Promise.

## Converged shape

The server version must be resolved before a connection is handed to a caller,
so `pool.serverVersion()` can answer synchronously from the memo the way
`pool_config.rb` does. Two halves:

- Make the connect path await `configureConnection()` rather than dropping the
  promise on the floor (`sqlite3-adapter.ts:290`), so `checkVersion()` has
  populated the memo by the time the adapter is leased.
- Let `serverVersion()` return the memoized value synchronously when it is set,
  falling back to the mutex-guarded probe only when cold — `_serverVersion ??
this._mutex.synchronize(...)` rather than an `async` body that always wraps.

Do NOT paper over a cold memo by returning `false` from a `supports_*`
predicate: that silently disables `RETURNING` on backends that have it.

Unblocks `converge-sql-for-insert-and-supports-insert-returning-to-sync`'s
first acceptance criterion. Its second (`sqlForInsert` itself sync) has an
independent blocker — `primaryKey(table_ref)` issues a schema query
(`abstract/schema-statements.ts:959`) — recorded on that story.

## Acceptance criteria

- [ ] The connect path awaits `configureConnection()`; no `void`-dropped promise
      leaves the server-version memo cold.
- [ ] `pool.serverVersion()` / `poolConfig.serverVersion()` return the memoized
      value synchronously when warm, mirroring `pool_config.rb`'s
      `@server_version ||=`.
- [ ] A test asserts the memo is warm on the first statement of a fresh
      connection, and fails on a baseline that drops the await.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
