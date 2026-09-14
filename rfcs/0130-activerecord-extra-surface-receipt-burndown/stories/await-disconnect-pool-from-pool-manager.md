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

## Acceptance criteria

- `disconnectPoolFromPoolManager` awaits `poolConfig.disconnectBang()` before it returns `dbConfig`.
- `removeConnectionPool` / `removeConnection` return `Promise<HashConfig | undefined>`, and
  `establishConnection` awaits the disconnect of a pool it clobbers. All callers are updated.
- No `void` disconnect remains in connection-handler.ts.
