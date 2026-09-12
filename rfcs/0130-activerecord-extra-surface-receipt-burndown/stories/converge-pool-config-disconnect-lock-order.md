---
title: "converge-pool-config-disconnect-lock-order"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7731 tried to route `ConnectionHandler#disconnect_pool_from_pool_manager` through
`pool_config.disconnect!` as Rails does (`abstract/connection_handler.rb:257-263`,
`pool_config.rb:52-65`). That deadlocked `base.test.ts` "connection in local time" on every
lane. Monitor-holder stacks showed the cycle:

- An in-flight `columns` load (`abstract/schema-statements.ts:799`) holds the adapter
  `lock` and waits for the `PoolConfig` monitor in `PoolConfig#serverVersion`. That method
  takes `connection.lock` BEFORE the monitor (#7622), where Rails' `server_version` takes only
  the monitor (`pool_config.rb:39-41`).
- `PoolConfig#disconnectBang` holds the monitor and awaits `AbstractAdapter#disconnectBang`,
  which needs that adapter lock.

Releasing the monitor before awaiting the drains (the `discardPoolBang` shape) fixes the hang,
but it breaks `pool-config.trails.test.ts` "serializes concurrent calls with different
automaticReconnect values" and "excludes a concurrent discardPoolBang while the disconnect is
in flight", which pin Rails' hold-across-disconnect semantics. So trails#7731 kept
`PoolConfig#disconnect` under `@noRailsEquivalent CONVERGEABLE converge-pool-and-cache-moved-residue`.

## Acceptance criteria

- The lock order is resolved so that `serverVersion`'s single-flight barrier (#7622) and
  `disconnect!` holding the `PoolConfig` monitor both hold without deadlock.
- `disconnect_pool_from_pool_manager` calls `poolConfig.disconnectBang()`;
  `PoolConfig#disconnect` is deleted along with its receipt.
- `base.test.ts` "connection in local time" / "connection in utc time" and all of
  `pool-config.trails.test.ts` pass on every adapter lane.
