---
title: "pinConnectionBang's fixture arm takes an unleased _connections[0] where Rails always leases"
status: ready
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `ConnectionPool#flush` in PR #7104 (RFC 0119). The
converged `flush` body now uses Rails' own predicate — `!conn.in_use? &&
conn.seconds_idle >= minimum_idle` over `@connections`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:651-661`)
— which made it worth checking that trails upholds Rails' invariant that a
pinned connection is always leased. It does not, structurally.

`ConnectionPool#pin_connection!` (`connection_pool.rb:324-338`) resolves the
connection from exactly TWO arms, and both yield a LEASED connection:

```ruby
def pin_connection!(lock_thread) # :nodoc:
  @pinned_connection ||= (connection_lease&.connection || checkout)
```

`connection_lease&.connection` is the current lease's connection (already
leased); `checkout` leases (`connection_pool.rb:547`). So `@pinned_connection.in_use?`
is true for the whole life of the pin, and Rails' `in_use?`-keyed branches —
`flush`'s predicate at `:653`, `disconnect`'s `if conn.in_use?` at `:456`,
`clear_reloadable_connections`' at `:509` — can rely on it.

`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`
(`pinConnectionBang`, around `:747-750`) adds a THIRD arm, at the FRONT of the
chain, that neither leases nor checks out:

```ts
const fixtureSharedConnection = slot === "fixture" ? (this._connections?.[0] ?? null) : null;
const leasedConnection = fixtureSharedConnection ?? this.connectionLease().connection;
// connection_pool.rb:326 — `@pinned_connection ||= (connection_lease&.connection || checkout)`.
const connection = pin?.connection ?? leasedConnection ?? (await this.checkout());
```

`this._connections?.[0]` is an arbitrary member of the pool's connection array.
It is not leased, not added to `_checkedOut`, and the local is named
`leasedConnection` even though this arm's value is exactly the one that is not
leased. The `{ fixture: true }` slot itself is the pool-scoped pin trails uses
so a fixture pin survives across execution contexts; that slot is not the
deviation — taking an unleased connection for it is.

The state is unreachable in Rails, so every Rails-faithful `in_use?` predicate
ported into this file is only accidentally safe. Probing one SQLite fixture
setup showed the pinned connection with `inUse === true` (the array's first
member happened to be leased), so this is a structural divergence whose effect
is not currently demonstrated by a failing test — which is precisely why it is
worth converging before something starts depending on it.

## Converged shape

Two arms, matching `connection_pool.rb:326`: the current lease's connection, or
`checkout`. If the pool-scoped fixture slot genuinely needs to reuse a
connection another execution context established, it must acquire it through
`checkout` (or lease it explicitly) so `in_use?` holds, rather than reading
`_connections[0]` directly. Rename the `leasedConnection` local only once it is
true to its name.

## Acceptance criteria

- [ ] `pinConnectionBang`'s connection resolution has no `_connections[0]` arm;
      it mirrors `connection_pool.rb:326`'s two arms.
- [ ] A connection held by the fixture pin satisfies `conn.inUse === true` for
      the life of the pin; a regression test asserts it and fails on baseline.
- [ ] The existing fixture-pin tests in `connection-pool.trails.test.ts`
      ("fixture pin survives across execution contexts", "context pin takes
      priority over fixture pin in unpin") still pass.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
