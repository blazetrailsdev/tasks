---
title: "activerecord: converge the driver-boundary rows left by connection-adapters-root part 2"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#8710
claim: "2026-10-09T14:09:43Z"
assignee: "migration-up-only-guards-on-an-optional-block"
blocked-by: null
closed-reason: null
---

## Context

Remainder of `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-2`,
which converged the rest of its rows and left these. Each sits on a driver or concurrency boundary
that needs its own decision before the body can take Rails' control flow.
`pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `connection-adapters/mysql2-adapter.ts#newClient` — `+if +if +throw +if +try +rescue +try +throw`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:23-36`).
  Rails is `::Mysql2::Client.new(config)` under one `rescue ::Mysql2::Error` holding a four-clause
  `case error.error_number`. The port also composes a `typeCast`, strips pool-only options, rescues a
  non-`Error` throw, and runs `initSql` under a second `try`. Same gem-shaped-client boundary as
  `mysql2-perform-query-takes-rails-control-flow-over-a-gem-shaped-raw-connection`.
- `connection-adapters/pool-config.ts#serverVersion` — `+if +try +if +try +if`
  (`connection_adapters/pool_config.rb:39-41`). Rails is
  `@server_version || synchronize { @server_version ||= connection.get_database_version }`. The port
  synchronizes on `connection.lock` instead of the pool config's own monitor and keeps a
  `_serverVersionInFlight` record so a second connection waits for the first fetch. Taking the pool
  config's monitor while `getDatabaseVersion` takes `connection.lock` can deadlock two sibling
  promises on one connection (CLAUDE.md § "The adapter lock defaults to a monitor"), so the lock
  order has to be settled first.
- `connection-adapters/postgresql-adapter.ts#disconnectBang` — `-rescue +if`
  (`connection_adapters/postgresql_adapter.rb:386-392`) and `#discardBang` — `-try -rescue +if`
  (`:394-398`). Rails is `super`, `@raw_connection&.close rescue nil` (or
  `socket_io&.reopen(IO::NULL) rescue nil`), `@raw_connection = nil`. The port's extra arm is the
  `_acquiring` / `_acquireGeneration` bookkeeping for an in-flight `_acquireFreshClient`, and the
  close is `.catch(() => {})` rather than a `try` / `catch`. Same client-pinning state
  `activerecord-converge-invented-control-flow-arms-postgresql-pg-client-boundary` moves.
- `connection-adapters/sqlite3-adapter.ts#constructor` — `+throw`
  (`connection_adapters/sqlite3_adapter.rb:117-121`). Rails is `rescue SystemCallError`. The fs
  backend's errors are not `SystemCallError` instances, so the port duck-tests `.code` and rethrows,
  which the skeleton reads as an arm. ruby-compat's own `isSystemCallError`
  (`packages/ruby-compat/src/file-utils.ts`) is the same test, unexported. Either
  `SystemCallError` answers `instanceof` for a coded fs error (as `Errno.EPIPE`'s
  `Symbol.hasInstance` does), or `extract-ts-api.ts#isRescueClassGuard` learns the duck-test guard.
- `connection-adapters/sqlite3-adapter.ts#encoding` — `+if +if` (`sqlite3_adapter.rb:237-239`).
  Rails is `any_raw_connection.encoding.to_s`. The port branches twice on whether
  `anyRawConnection()` and `pragma("encoding")` answered a promise.

Two rows in these files were in no story's list and are still reported:

- `connection-adapters/mysql2-adapter.ts#supportsJson` — `+if`
- `connection-adapters/sqlite3-adapter.ts#tableStructureSql` — `+if`

Rows in these files that other stories already own, for reference: `pool-config.ts#discardPoolsBang`
and `#disconnectAllBang` (`pool-config-instances-is-an-objectspace-weak-map`),
`postgresql-adapter.ts#translateException` (`pg-driver-errors-carry-a-result-at-the-raw-connection-boundary`),
`postgresql-adapter.ts#configureConnection` (`arms-awaited-block-enumerable-reads-as-invented-loop`),
`removeIndex` in both adapters (`arms-extractor-reads-a-kwargs-rebinding-guard`),
`schema-cache.ts#_loadFrom` (`schema-cache-load-from-ports-the-marshal-and-yaml-load-arms`),
`sqlite3-adapter.ts#newClient` (`activerecord-sqlite3-new-client-is-one-async-body-with-timeout-in-configure-connection`),
and the other `mysql2-adapter.ts` rows
(`activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-1-residue`).

`SchemaReflection#cache` (`connection_adapters/schema_cache.rb:106-108`) now reads
`@cache ||= load_cache(pool) || empty_cache` with no arm, but still memoizes the in-flight load in
`_cachePromise` so two concurrent cold callers share one `SchemaCache`. Decide here whether that memo
stays.

## Acceptance criteria

- [ ] Each row above is converged onto Rails' control flow, or fixed in `scripts/api-compare/` with a unit test where it is an extractor false positive.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows none of the seven rows listed first.
- [ ] The MySQL, PostgreSQL and SQLite adapter suites stay green.
