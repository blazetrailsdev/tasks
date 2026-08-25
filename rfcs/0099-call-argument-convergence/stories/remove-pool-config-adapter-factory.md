---
title: "Remove the PoolConfig adapterFactory field"
status: done
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6826
claim: "2026-08-21T15:50:42Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder-part-3"
blocked-by: null
closed-reason: null
---

## Context

`PoolConfig#adapterFactory` (`packages/activerecord/src/connection-adapters/pool-config.ts`)
is trails-only surface: Rails resolves the adapter class from
`db_config.adapter` by `require`-ing it at connect time, so
`connection_handler.rb:279` constructs `PoolConfig.new(connection_name,
db_config, role, shard)` with no factory and `connection_pool.rb`'s
`new_connection` goes through the resolved class.

PR for `args-dl-adapter-factory-invented-kwarg` converged the two argument
lists — `resolvePoolConfig` and `new PoolConfig(...)` in
`connection-adapters/abstract/connection-handler.ts` now pass exactly Rails'
four arguments, and the factory is ASSIGNED onto the returned pool config
instead. The field itself remains, tagged `@noRailsEquivalent CONVERGEABLE`.

Removing it entirely means every caller reaching for a pre-built adapter goes
through the by-name path instead. Current callers:

- `connection-handling.ts:156`, `:948`
- `support/pooled-sqlite-adapter.ts:30`
- `support/second-connection.ts:42`
- `support/template-global-setup.ts:76,:84`
- consumed at `connection-adapters/abstract/connection-pool.ts:1340-1347`
- `tasks/database-tasks.ts:1311` already documents the by-name fallback

The by-name path exists: `resolveConnectionAdapter(dbConfig.adapter)` is
awaited into `pool.adapterReady` (`connection-handler.ts` establishConnection).
The blocker is that `newConnection()` is synchronous, so a caller that never
awaits `adapterReady` needs the factory.

## Acceptance criteria

- `adapterFactory` is gone from `PoolConfig`, `ConnectionPool#newConnection`,
  and `establishConnection`'s options, or the residue is a single documented
  `@noRailsEquivalent PERMANENT` naming the synchronous-`newConnection` fact.
- The `PoolConfig` constructor's fifth options parameter is gone (its remaining
  callers are all tests).
- `pnpm parity:api:extra --package activerecord` no longer reports it.
