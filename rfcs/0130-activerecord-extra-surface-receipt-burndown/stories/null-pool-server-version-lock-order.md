---
title: "NullPool#serverVersion keeps the lock-then-mutex edge PoolConfig dropped"
status: in-progress
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#7779
claim: "2026-09-15T12:25:16Z"
assignee: "await-disconnect-pool-from-pool-manager"
blocked-by: null
closed-reason: null
---

## Context

trails#7750 fixed a deadlock in `PoolConfig#serverVersion`
(`packages/activerecord/src/connection-adapters/pool-config.ts`): #7622 had it take
`connection.lock` and then the `PoolConfig` monitor, the reverse of
`PoolConfig#disconnectBang`'s monitor-then-adapter-lock order. The fix drops the monitor
from `serverVersion` and keeps single-flight with an in-flight fetch slot.

`NullPool#serverVersion` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`,
~:91) still has the #7622 shape: `connection.lock.synchronize(() => this._mutex.synchronize(async () => ...))`.
Rails' `NullPool#server_version` is `@server_version || @mutex.synchronize { @server_version ||= connection.get_database_version }`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:26,30-31`). It takes only the mutex.
Any flow that holds `_mutex` and then waits on an adapter lock recreates the cycle.

## Converged shape

Mirror the `PoolConfig` fix: no lock-then-mutex edge. `@server_version ||` fast path,
then a single-flight barrier that does not need a second monitor while the adapter lock is held.

## Acceptance criteria

- `NullPool#serverVersion` has no `connection.lock` → `_mutex` acquisition order.
- `pool-server-version.trails.test.ts` single-flight and re-entrant arms stay green, and a new arm pins that no deadlock occurs when `_mutex` is held by another flow.
