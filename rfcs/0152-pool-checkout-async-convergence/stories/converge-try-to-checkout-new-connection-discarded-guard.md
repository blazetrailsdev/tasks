---
title: "Stop a discarded pool before tryToCheckoutNewConnection so its _connections guard can go"
status: in-progress
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8030
claim: "2026-09-24T13:26:46Z"
assignee: "converge-migration-connection-cold-arm-onto-awaited-lease"
blocked-by: null
closed-reason: null
---

## Context

Rails' `try_to_checkout_new_connection` reads `@connections.size` with no nil check
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:904`).
trails' `tryToCheckoutNewConnection`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`) still has a
`this._connections &&` guard. trails#8017 kept it because a real caller reaches it:

- `acquireConnection` calls `await this.reap()` between its two
  `tryToCheckoutNewConnection()` attempts. Rails' `reap` (`:625-642`) is synchronous, so
  nothing runs between the two attempts in `acquire_connection` (`:862-878`). In trails a
  concurrent `discardBang()` can finish during that wait and set `_connections = null`
  (`discard!`, `:487-497`).
- Measured on trails#8017. Setup: pool size 1, one connection checked out, a `Thread`
  running `pool.checkout()` concurrently with `pool.discardBang()`. Without the guard this
  throws `TypeError: Cannot read properties of null (reading 'length')`. With the guard
  the call returns null. `_available` is then null too, so the caller gets
  `ConnectionTimeoutError` ("Could not obtain a connection..."), not
  `ConnectionNotEstablished("Connection pool has been discarded")`.
- The `withNewConnectionsBlocked` `finally` → `bulkMakeNewConnections` path (Rails
  `:832-848`) reaches `tryToCheckoutNewConnection` as well. Its loop already tolerates
  `_connections ?? []`.

## Converged shape

Stop a discarded pool at `acquireConnection`'s discarded check after the awaited reap.
This is the same re-check `acquireConnection` already does after an awaited `poll`
(`if (waited) ensureLive()`). Then `tryToCheckoutNewConnection` reads
`this._connections.length` bare, as `:904` does.

## Acceptance criteria

- A regression test (the scenario above) asserts `ConnectionNotEstablished` and fails on
  the pre-change code.
- The `_connections &&` guard in `tryToCheckoutNewConnection` is removed.
- Measure whether the `bulkMakeNewConnections` path can run on a discarded pool. Either
  stop it too, or record here why it cannot run.
