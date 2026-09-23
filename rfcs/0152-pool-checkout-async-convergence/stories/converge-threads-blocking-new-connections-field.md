---
title: "Declare ConnectionPool#_threadsBlockingNewConnections = 0 and drop its ?? 0 fallbacks"
status: in-progress
updated: 2026-09-23
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8017
claim: "2026-09-23T22:47:17Z"
assignee: "converge-threads-blocking-new-connections-field"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ConnectionPool#initialize` seeds `@threads_blocking_new_connections = 0`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:264`),
and every reader uses it bare: `@threads_blocking_new_connections.zero?` in
`try_to_checkout_new_connection` (`:904`), and `+= 1` / `-= 1` in
`with_new_connections_blocked` (`:823-850`).

trails' `ConnectionPool` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`)
never declares `_threadsBlockingNewConnections`. The field sits beside the
`_nowConnecting` that trails#8016 added in Rails' position. Because it is
undefined until first written, every reader patches over that:
`(this._threadsBlockingNewConnections ?? 0) === 0` in `tryToCheckoutNewConnection`,
`(this._threadsBlockingNewConnections ?? 0) + 1` and the `!` non-null decrement
in `withNewConnectionsBlocked`. `tryToCheckoutNewConnection` also carries a
`this._connections &&` guard that Rails' `:904` does not have. It exists because
`discard!` nulls `_connections`.

## Acceptance criteria

- `ConnectionPool` declares `private _threadsBlockingNewConnections = 0` next to
  `_nowConnecting`, in `initialize`'s order (`:258-265`).
- The `?? 0` fallbacks and the `!` go. The readers are
  `this._threadsBlockingNewConnections === 0`, `+= 1` and `-= 1`, as Rails has them.
- The `_connections &&` guard in `tryToCheckoutNewConnection` is either removed,
  if every discarded-pool path is already stopped at `acquireConnection`'s
  discarded check, or kept with the measured caller that reaches it.
