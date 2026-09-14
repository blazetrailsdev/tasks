---
title: "await-disconnect-pool-from-pool-manager"
status: draft
updated: 2026-09-14
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

Rails' `ConnectionHandler#disconnect_pool_from_pool_manager`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:256-262`)
finishes `pool_config.disconnect!` before it returns `pool_config.db_config`. The
callers `establish_connection` (`:113-140`) and `remove_connection_pool` (`:130-139`)
therefore see the old pool fully disconnected.

trails (`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts`,
`disconnectPoolFromPoolManager`) runs `void poolConfig.disconnectBang()`. That is
fire-and-forget: the disconnect's Promise is never awaited and any rejection is
dropped. It stays that way because `ConnectionHandler#establishConnection` /
`#removeConnectionPool` and `ConnectionHandling#removeConnection` are synchronous and
have about 200 and 70 call sites respectively (surfaced by review on trails#7750).

## Design (agreed on trails#7750 review)

`establishConnection` cannot become async: `connects_to` runs from model
static blocks. So it keeps a sync return and the clobbered pool's disconnect
folds into the pool's existing pre-warm Promise, `pool.adapterReady`
(`connection-handler.ts` sets it; `database-tasks.ts:843,848` already awaits
it). `await pool.adapterReady` then means "old pool disconnected, adapter
loaded". Make the pre-warm _required_: the pool's checkout path awaits
`adapterReady` before its first `newConnection`, so a caller that skips the
await cannot lease a connection while the old pool is still draining.

Everything below `establishConnection` goes async for real.

## Acceptance criteria

- `disconnectPoolFromPoolManager` awaits `poolConfig.disconnectBang()` before it returns `dbConfig`.
- `removeConnectionPool` / `removeConnection` return `Promise<HashConfig | undefined>`; all
  ~35 callers are updated (mostly test teardown and `activerecord-cli`).
- `establishConnection` stays sync; its clobber branch folds the disconnect into
  `pool.adapterReady`, and `ConnectionPool` checkout awaits `adapterReady` before the first
  `newConnection`.
- No `void` disconnect remains in connection-handler.ts.
