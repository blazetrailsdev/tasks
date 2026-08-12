---
title: "converge-pool-config-pool-under-the-monitor"
status: blocked
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-12T18:16:48Z"
assignee: "converge-pool-config-pool-under-the-monitor"
blocked-by: "Blocked on `Model.quotedTableName` and `Relation#aliasTracker`, which are sync in Rails and cannot absorb the await.\n\nMeasured the cascade by making the flip and running `pnpm typecheck` at each frontier:\n\n1. `PoolConfig#pool` -> `async pool()` (pool_config.rb:70-72): 6 non-test callers, all in `connection-adapters/abstract/connection-handler.ts` (`connectionPoolList`, `eachConnectionPool`, `establishConnection` x2, `retrieveConnectionPool`).\n2. Making those four async: 21 non-test errors, the load-bearing one being `connectionPool()` in `connection-handling.ts:459`.\n3. Making `connectionPool()` async: 58 non-test errors across 17 files, and the frontier does not terminate at a Rails-async boundary. It lands on two methods Rails defines as synchronous:\n\n- `Model.quotedTableName` (`model-schema.ts:645`). Rails: `quoted_table_name` -> `adapter_class` -> `connection_pool` (`model_schema.rb:283-286`, `connection_handling.rb:338-340`), all sync. trails routes it through `reflectionAdapter` (`model-schema.ts:39-45`), which reads `connectionPool.call(klass)`. `quotedTableName` is called synchronously from Arel/SQL construction; making it a promise is a strictly larger Rails divergence than the unlocked `#pool` it would be buying.\n- `Relation#aliasTracker` (`relation.ts:6318`). Rails: `alias_tracker(joins = [], aliases = nil)` -> `AliasTracker.create(model.connection_pool, ...)` (`relation.rb:1307-1309`), sync, called from sync join construction.\n\nSame shape hits `adapterClassSync` (`connection-handling.ts:545`), `cachedTableExists` (`model-schema.ts:1559`, documented as sync-only precisely because `tableExists` is async), and the `leaseConnectionSync()` readers in `model-schema.ts:44` / `base.ts:5080` / `tasks/database-tasks.ts:1382`.\n\nA synchronous fast-path through the monitor is not an alternative: it would let a sync `#pool` reader walk into the critical section while `#disconnect!`/`#discard_pool!` hold the lock across a real suspension point, which is the exact interleaving the monitor exists to prevent. Ruby blocks there; we would not.\n\nUnblocking this needs the sync schema-reflection surface (`quotedTableName` / `reflectionAdapter` / `cachedTableExists`) and `Relation#aliasTracker` to stop reaching for a pool synchronously first — i.e. it is downstream of the RFC 0023 pool async-surface convergence, not a peer of it."
closed-reason: null
---

# Run PoolConfig#pool under the ported monitor

## Context

Split out of `converge-pool-config-pool-and-server-version-under-the-monitor`
(RFC 0084), whose `#serverVersion` half landed in PR TBD. `#serverVersion` now
mirrors `pool_config.rb:39-41` including the `synchronize` block; `#pool` does
not.

Rails: `@pool || synchronize { @pool ||= ConnectionAdapters::ConnectionPool.new(self) }`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/pool_config.rb:70-72`).
The TS getter (`packages/activerecord/src/connection-adapters/pool-config.ts`,
`get pool()`) does the read-check-write with no lock, and carries a per-method
"left unlocked deliberately" JSDoc finding.

The blocker is the caller shape, not the body: the ported `synchronize`
(`packages/activesupport/src/concurrency/monitor.ts`) is `async`, so taking the
monitor turns a Ruby attribute-shaped reader into a promise-returning method.
`poolConfig.pool` is read synchronously from ~105 non-test call sites (including
`Base.connectionPool()` and the whole `ConnectionHandler` surface), so the flip
is its own PR-sized change and cannot ride along with the `#serverVersion`
convergence under a 700-LOC ceiling.

## Acceptance criteria

- [ ] `#pool` mirrors `pool_config.rb:70-72` including the `synchronize` block,
      with every sync caller of `poolConfig.pool` converged onto the awaited
      shape.
- [ ] The "left unlocked deliberately" JSDoc finding on `get pool()` is deleted,
      not reworded.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] If a specific caller genuinely cannot absorb the await, `pnpm tasks block`
      with that caller named.
