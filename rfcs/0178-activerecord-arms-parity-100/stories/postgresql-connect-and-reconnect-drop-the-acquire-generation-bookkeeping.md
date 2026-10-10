---
title: "activerecord: PostgreSQL connect and reconnect carry in-flight acquire bookkeeping Rails has none of"
status: ready
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' PostgreSQL `connect` is `@raw_connection = self.class.new_client(@connection_parameters)`
under `rescue ConnectionNotEstablished => ex; raise ex.set_pool(@pool)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:938-942`),
and `reconnect` (`:944-952`) is `@raw_connection&.reset` under `rescue PG::ConnectionBad`, which
nils the connection, then `connect unless @raw_connection`.

`packages/activerecord/src/connection-adapters/postgresql-adapter.ts` routes `connect` through
`_acquireFreshClient` and `_doAcquire`, which share one in-flight acquire and carry state Rails
has none of: `_acquiring`, `_acquiringGen` and `_acquireGeneration`. `reconnect` is
`_discardRawConnection()` (end the client, reset the statement pool) then `connect`, with no
`reset` arm.

trails#8718 reduced `discardBang` to Rails' three lines (`:394-398`) and deleted `_closed`,
`_discardedAcquireGeneration` and `_teardownRacedClient`. What it left, with no receipt because
no `@inventedArm` shape fits a counter:

- The `_rawConnection` setter increments `_acquireGeneration` on every write. That is how an
  awaited acquire learns `discard!` ran under it, since Rails' `discard!` takes no lock.
- `disconnectBang` increments `_acquireGeneration` before `end()`, a statement
  `postgresql_adapter.rb:385-391` does not have.
- `_doAcquire`'s "slot already filled" arm, reached when `verifyBang` seats
  `_unconfiguredConnection` through `_connection` while an acquire is in flight.

mysql2 lost the same bookkeeping in trails#8718 because every production connect there runs
under the adapter lock and `discard!` takes it too (`mysql2_adapter.rb:131-137`). PostgreSQL's
`reconnect` also runs only under the lock (`reconnectBang`), so the counter guards only a
`discard!` that lands while a connect is awaiting.

## Acceptance criteria

- [ ] `connect` is `this._rawConnection = await PostgreSQLAdapter.newClient(...)` under Rails'
      rescue, and `reconnect` has Rails' `reset` / `rescue` / `connect unless` arms.
- [ ] `_acquireFreshClient`, `_doAcquire`, `_acquiring`, `_acquiringGen`, `_acquireGeneration`,
      the setter's increment and `disconnectBang`'s increment are deleted, or each survivor is
      shown to be forced by an awaited connect racing the unlocked `discard!` and the limit is
      taken to the repo owner for a CLAUDE.md ruling.
- [ ] `adapters/postgresql/postgresql-adapter.trails.test.ts` "in-flight acquire adoption race"
      is kept green or re-specified against the converged shape.
- [ ] The PostgreSQL lane stays green for `adapters/postgresql/` and `connection-adapters/`.
