---
title: "newRawTestAdapter assigns a pool post-hoc; Rails adapters come from pool.checkout"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6215
claim: "2026-08-08T01:42:08Z"
assignee: "raw-test-adapters-should-come-from-pool-checkout"
blocked-by: null
closed-reason: null
---

## Context

PR #6210 gave `newRawTestAdapter` (`packages/activerecord/src/test-adapter.ts`,
`withRawTestPool`) a real pool, but not Rails' _shape_: it constructs the
adapter first and then hands it a `ConnectionPool` whose `adapterFactory`
returns that same instance, assigning `adapter.pool` post-hoc. Rails has no
route by which an adapter acquires a pool after construction — a connection
comes out of `ConnectionPool#checkout`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb`),
which builds it through `new_connection` and owns it from birth. The
constructor's `NullPool` seed (`abstract_adapter.rb:153`) is the only pool an
un-checked-out adapter ever has in Ruby.

Consequences of the current shape:

- The pool is never checked out of, so `@checked_out` / the lease queue /
  `active_connection?` all describe an empty pool that nonetheless has a live
  connection. `pool.connections` is empty while `adapter.pool` points back.
- `adapter.schemaCache` now resolves through `ConnectionPool#schemaCache`
  (`connection-pool.ts:438`), whose `BoundSchemaReflection` reaches the adapter
  by checking out — a re-entrancy the lone-connection reflection
  (`BoundSchemaReflection.forLoneConnection`, `schema-cache.ts:975-980`) did not
  have.
- Each raw adapter allocates a throwaway `HashConfig` + `PoolConfig` +
  `ConnectionPool` (plus a `Reaper`, currently a no-op only because the built
  hash carries no `reapingFrequency`).

The single-server-connection cap is the constraint that forced this: each raw
adapter caps its driver at one connection (`max: 1` / `connectionLimit: 1`)
precisely because the outer `ConnectionPool` multiplexes, so a stock pool that
builds its own connections cannot stand in.

## Converged shape

`newRawTestAdapter` obtains its adapter from `pool.checkout()`, so the pool owns
the connection from birth and `adapter.pool` is never assigned from outside.
The blocker to solve is that `newRawTestAdapter` is _synchronous_ — it is passed
as `adapterFactory` to test-local pools (`connection-pool.test.ts:40`,
`connection-pool.trails.test.ts:60,725,748,765,1026`,
`pooled-connections.test.ts:18`) and trails' `checkout()` is async
(`connection-pool.ts:797`). Either those call sites move to an async factory, or
the direct-use call sites (`migration.trails.test.ts:46,55`,
`statement-pool.test.ts:114`, `schema-cache.test.ts:817`,
`uniqueness-validation.trails.test.ts:96`, `test-adapter.trails.test.ts:22,33`)
get an awaited variant and the sync factory keeps its `NullPool`.

Related: this is the same class of work as
[[database-tasks-adapters-carry-a-real-pool]] and the merged
`create-and-migrate-adapters-carry-a-real-pool`.

## Acceptance criteria

- [ ] Raw test adapters come out of `pool.checkout`; nothing assigns
      `adapter.pool` from outside the pool.
- [ ] The one-server-connection-per-raw-adapter cap is preserved.
- [ ] No test renamed; sqlite (file + `sqlite3_mem`), PG and MariaDB green.
