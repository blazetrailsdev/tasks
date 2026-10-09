---
title: "activerecord: mysql2 and PostgreSQL discard! carry no connect-generation bookkeeping"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8718
claim: "2026-10-09T17:09:43Z"
assignee: "active-record-base-inherited-chain-needs-one-deferred-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8661, which made each adapter's `discard!` call its own driver's method. The Rails lines are now in place, but both TS bodies still carry statements Rails' bodies do not have.

Rails:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:394-398`: `super`, `@raw_connection&.socket_io&.reopen(IO::NULL) rescue nil`, `@raw_connection = nil`.
- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:131-137`: inside `@lock.synchronize`, `super`, `@raw_connection&.automatic_close = false`, `@raw_connection = nil`.

trails, extra to those:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts` `discardBang`: `void this._statements.reset()`, `this._closed = true`, `if (this._acquiring) this._discardedAcquireGenerations.add(this._acquireGeneration)`, `this._acquireGeneration++`. Read by `_acquireFreshClient`, `_doAcquire` and `_teardownRacedClient`.
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts` `discardBang`: the `_connectingPromise` / `_discardedConnectGenerations.add` arm, `this._connectGeneration++`, `this._connectionConfigured = false`, `this._statements = null`. Read by `_ensureClient`'s raced-connect arm.

They exist because trails' connect is awaited: a `discard!` can land while a connect is in flight, and the generation counters are how that connect learns to abandon its client instead of installing it. Rails' connect is synchronous, so no such window exists.

Neither arm is receipted. `@inventedArm` on the two declarations is not the fix; this story converges.

## Converged shape

mysql2's `discard!` already runs under `@lock`. If every connect path (`_ensureClient`, `connect`, `reconnect`) also runs under the adapter lock, a `discard!` waits for the in-flight connect and abandons the installed `_rawConnection`, and the mysql2 generation set and counter are unneeded in `discardBang`. Measure first whether `connect()` (`mysql2-adapter.ts`) reaches `_ensureClient` outside the lock.

PostgreSQL's `discard!` is not under the lock in Rails, so the same route is not available as written. Establish whether the acquire path can be serialized so that `discardBang` needs only Rails' three lines, or `pnpm tasks block` with the specific blocker.

## Acceptance criteria

- [ ] `Mysql2Adapter#discardBang` is `super`, the `automaticClose = false` call and `_rawConnection = null` inside `lock.synchronize`, and nothing else.
- [ ] `PostgreSQLAdapter#discardBang` is `super`, the `socketIo()?.reopen(IO.NULL)` call and `_rawConnection = null`, and nothing else, or the story is blocked with the blocker named.
- [ ] A discard during an in-flight connect still leaves no live client installed on either adapter (the existing raced-connect tests stay green on the MySQL and PostgreSQL lanes).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:throws` green.
