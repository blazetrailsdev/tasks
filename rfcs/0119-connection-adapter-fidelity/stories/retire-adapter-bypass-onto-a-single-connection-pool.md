---
title: "_adapter is a reader bypass where Rails has only connection_pool"
status: blocked
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps:
  [
    "connection-pool-cannot-seat-an-existing-adapter-instance",
    "bound-adapter-test-doubles-cannot-satisfy-the-pool-protocol",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-09-08T16:01:58Z"
assignee: "retire-adapter-bypass-onto-a-single-connection-pool"
blocked-by: "Needs new ConnectionPool seating API + connection-handler registration that the story does not budget. A directly-bound model can only resolve through connectionPool if the given adapter INSTANCE is seated in a real pool: PoolConfig needs a HashConfig (a bound mock has none), the handler's setPoolManager is private so registration must go through establishConnection with _connectionClass=true (which changes connectionClassForSelf/shardKeys/connectedTo semantics for every bound model), and ConnectionPool has no public way to seat an existing connection - _connections/_available are private, checkin() no-ops for an unknown conn, and pinConnectionBang is async and opens a transaction. Once seated, every read routes through Queue#poll -> conn.lease() and checkoutAndVerify, so all 111 'X.adapter = <double>' sites across 27 activerecord test files (model-schema-load, model-schema-reload-recursion, migration.test.ts, hot-compatibility, core.trails, encryption/test-helpers) need their doubles taught lease/expire/steal/verifyBang/owner/dbConfig. That is far past the 700 LOC ceiling and past the ~200 LOC estimate; it wants its own RFC 0119 story pair (pool seating API first, then the doubles)."
closed-reason: null
---

## Context

`_adapter` (`packages/activerecord/src/base.ts:723`, set by
`Base.adapter=` at `:910-928`) is a trails invention: a `DatabaseAdapter`
bound directly onto a model class, bypassing the pool. Ruby has one resolution
path and no such concept — `lease_connection` is `connection_pool.lease_connection`
(`vendor/rails/activerecord/lib/active_record/connection_handling.rb:309`) and
`with_connection` is `connection_pool.with_connection` (`:313`).

PR #7539 closed `lease-connection-ignores-directly-bound-adapter` by taking
that story's **first** option — `leaseConnection` now consults `_adapter` the
same way `connection` (`connection-handling.ts:365`) and `withConnection`
(via `leasablePool`, `:315-321`) already did, so all three readers agree.
The story named a second, preferred option it explicitly called "better, and
the direction the rest of the repo is moving":

> `_adapter` stops being a reader bypass at all and a directly-bound model
> resolves through a real single-connection pool, so all three readers go
> through `connectionPool` exactly as `connection_handling.rb:309,313` do.

That is still undone, and the bypass now has **three** call sites instead of
two, so the invention is more entrenched than before. Related bypasses that
would go with it: `threadedConnectionFor`'s `_adapter` early return
(`connection-handling.ts:59`, itself carrying a `@noRailsEquivalent
CONVERGEABLE` receipt) and `adapterClassSync`'s (`:391`).

## Converged shape

A model bound with `Base.adapter=` gets a real `ConnectionPool` holding that
one connection, so `connection`, `leaseConnection` and `withConnection` are
each a bare delegation to `connectionPool` as
`connection_handling.rb:309,313` are, with no `_adapter` branch anywhere. The
`leasablePool` null-return branch and every `_adapter` early return then go
with it.

## Acceptance criteria

- [ ] No reader in `connection-handling.ts` branches on `_adapter`.
- [ ] `connection-handling.trails.test.ts`'s "connection, leaseConnection and
      withConnection resolve to the same session" still passes, now because
      they share a pool rather than because three branches agree.
- [ ] `threadedConnectionFor`'s `@noRailsEquivalent CONVERGEABLE` receipt is
      deleted with its `_adapter` guard.
- [ ] `pnpm parity:api:extra:gate` novel count does not grow; three AR adapter
      lanes green.
