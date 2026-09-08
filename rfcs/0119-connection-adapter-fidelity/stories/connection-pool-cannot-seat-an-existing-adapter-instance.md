---
title: "connection-pool-cannot-seat-an-existing-adapter-instance"
status: draft
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`retire-adapter-bypass-onto-a-single-connection-pool` (RFC 0119) is blocked on
a missing capability, not on diff size. That story wants a model bound with
`Base.adapter=` (`packages/activerecord/src/base.ts:910-928`) to resolve
through `connectionPool` exactly as `lease_connection` and `with_connection`
do (`vendor/rails/activerecord/lib/active_record/connection_handling.rb:309,313`),
which requires seating a _given adapter instance_ in a real pool. Nothing in
`ConnectionPool` can do that today:

- `_connections` and `_available` are private
  (`connection-adapters/abstract/connection-pool.ts:243-244`).
- `checkin(conn)` no-ops for a connection the pool has never checked out — it
  guards on `this._checkedOut.has(conn)` (`:571-577`).
- `pinConnectionBang` (`:440`) is async and opens a transaction, and its pin is
  per-execution-context (`_resolvePinnedConnection`, `:923-927`), so it is not a
  seat.
- The only seating path, `adoptConnection` (`:1170-1177`), is a module-level
  function assigned as a private field (`:942`) and does not enqueue into
  `_available`, so `acquireConnectionSync` (`:556`) still falls through to
  `tryToCheckoutNewConnection`, which refuses once `_connections.length >=
  this.size`.

`PoolConfig` (`connection-adapters/pool-config.ts:29-42`) also requires a
`HashConfig`, which a bound adapter built outside a pool does not have — its
`pool` is a `NullPool` (`abstract-adapter.ts:793`).

## Converged shape

Rails has no counterpart, because Ruby never binds a bare adapter to a model —
so the seat is trails-only surface and needs a
`@noRailsEquivalent PERMANENT` receipt at its declaration, sized to exactly one
method. It adopts the connection (setting `conn.pool`, pushing to
`_connections`) and enqueues it into `_available` so `checkout` /
`acquireConnectionSync` hand back that instance. Pair it with a `HashConfig`
derived from the adapter's own `pool.dbConfig` when it has one, and a minimal
synthesized config when it does not.

Registration is the second half: `ConnectionHandler#setPoolManager` is private
(`connection-adapters/abstract/connection-handler.ts:326`), so a bound model
has to reach the handler through the public `establishConnection`
(`:137-197`), which resolves the owner name via `connectionSpecificationName`
(`connection-handling.ts:585-595`) and therefore needs the bound class to be
its own connection class — decide and record whether `_connectionClass = true`
is acceptable, since it also moves `connectionClassForSelf`, `shardKeys` and
`connectedTo` for every bound model.

## Acceptance criteria

- [ ] `ConnectionPool` gains one seating method, receipted
      `@noRailsEquivalent PERMANENT`, that makes a given adapter instance the
      pool's single connection.
- [ ] A pool seated that way returns that exact instance from `checkout()`,
      `leaseConnection()`, `leaseConnectionSync()` and `withConnection`.
- [ ] The registration path for a directly-bound model is settled and covered
      by a test — including what happens to `connectionSpecificationName` and
      `_connectionClass`.
- [ ] `pnpm parity:api:extra:gate` activerecord `novel` does not rise (the
      receipt scores the member `Allowed`).
- [ ] `retire-adapter-bypass-onto-a-single-connection-pool` is unblocked.
