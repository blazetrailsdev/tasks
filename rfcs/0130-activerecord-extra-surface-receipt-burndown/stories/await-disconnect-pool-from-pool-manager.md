---
title: "await-disconnect-pool-from-pool-manager"
status: done
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7800
claim: "2026-09-15T15:50:15Z"
assignee: "await-disconnect-pool-from-pool-manager"
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

`establishConnection` becomes faithfully async, in Rails' order: remove the
pool config, `await pool_config.disconnect!`, then `set_pool_config`
(`connection_handler.rb:139-140`). An `async` body runs synchronously until its
first `await`, and the only `await` sits on the clobber branch, so a model
calling `connectsTo` from a static block — where no pool exists yet — still has
its pool registered before the call yields. Static-block callers do not await
the returned Promise; there is no `connectsToSync` twin, which would be invented
surface with no Rails counterpart. A model that clobbers from a static block has
a window with no registered pool until the disconnect settles; that is Rails'
ordering and is accepted.

`pool.adapterReady` stays as it is today; it does not need to carry the
disconnect and checkout does not need to enforce it.

## Acceptance criteria

- `disconnectPoolFromPoolManager` awaits `poolConfig.disconnectBang()` before it returns
  `dbConfig`; no `void` disconnect remains in connection-handler.ts.
- `establishConnection` and `connectsTo` return Promises of their Rails return values, with
  the disconnect awaited before `setPoolConfig` on the clobber branch.
- `removeConnectionPool` / `removeConnection` return `Promise<HashConfig | undefined>`.
- All callers are updated (~77 `establishConnection`, ~35 remove sites, nearly all tests
  and `activerecord-cli`); static-block `connectsTo` call sites simply do not await.
- No `connectsToSync` or other sync twin is added.
