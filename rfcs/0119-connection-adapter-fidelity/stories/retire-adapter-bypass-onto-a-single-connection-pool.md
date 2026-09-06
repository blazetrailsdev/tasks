---
title: "_adapter is a reader bypass where Rails has only connection_pool"
status: draft
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
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
