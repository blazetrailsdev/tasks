---
title: "ConnectionPool#with_connection: overlapping calls on an empty lease each check out a connection"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing the `Active Record SQLite :memory: Tests` red on main
(story `red-208d804c`, trails#8735).

Rails' `ConnectionPool#with_connection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:405-424`)
reads `lease.connection`, and when it is unset runs
`yield lease.connection = checkout`. In Ruby a lease belongs to one thread, so
nothing else can observe the lease between the read at `:410` and the write at
`:418`.

trails' port (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`,
`withConnection`, the `else` arm) is
`fn((lease.connection = await this.checkout()))`. The `await` suspends between
the `lease.connection` read and the write, and one async context can hold
several in-flight calls on the same lease. So two `withConnection` calls that
overlap on an empty lease (`Promise.all([Post.count(), Post.first()])` with
nothing leased, or the `find_target` shape trails#8731 shipped) each see
`lease.connection` unset and each call `checkout`. The second write overwrites
the first on the lease, both `ensure` arms call `releaseConnection(lease)`, and
the two blocks ran on different connections. On a file database that is a
stray checkout; under `ARCONN=sqlite3_mem` the second connection is an empty
database and the statement raises `no such table`.

trails#8735 fixed the one caller that overlapped (`Association#findTarget`,
`associations/association.rb:248-271`); the pool body is unchanged, so any
other pair of overlapping `withConnection` calls on an unleased context still
does this. `withConnectionSync` in the same file has the same read-then-write
shape with a promise arm.

Related, both closed: RFC 0146 (exclusive connection leasing) and
`connection-pool-checkout-async-critical-section` (RFC 0119). Check whether
either already claims this window before sizing.

## Converged shape

One lease resolves to one connection, as in Ruby: a second `with_connection`
entered on the same lease while the first one's `checkout` is pending must be
handed that same connection (and must not release it out from under the
first), with no new public surface on `ConnectionPool`.

## Acceptance criteria

- With nothing leased, `Promise.all` of two `klass.withConnection` blocks on
  the same pool runs both blocks on the same connection and calls `checkout`
  once; the lease is released once, after both settle.
- A trails test pins that, and fails on the current body.
- `ARCONN=sqlite3_mem pnpm vitest run packages/activerecord/src/transactions.test.ts`
  stays green with `Association#findTarget`'s ordering reverted locally (the
  pool, not the caller, holds the invariant).
- `parity:api:calls`, `parity:api:calls:args`, `parity:api:extra:gate` green.
