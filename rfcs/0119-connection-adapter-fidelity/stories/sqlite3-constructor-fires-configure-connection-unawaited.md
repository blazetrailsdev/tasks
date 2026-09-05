---
title: "sqlite3-constructor-fires-configure-connection-unawaited"
status: closed
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone on origin/main: the escape clause the story itself names has triggered. sqlite3-adapter-connects-eagerly-in-constructor landed as #7287, and the constructor no longer fires the un-awaited configure — `git grep 'void this.configureConnection'` over origin/main returns nothing anywhere in the repo, and sqlite3-adapter.ts:291 now only sets `this._asyncConnectPending = this.driverIsAsync()`. configureConnection is awaited on both connect paths: connectBang (sqlite3-adapter.ts:1705) and _doAsyncConnect (:1704-1706), the latter drained through completeAsyncConnect/ensureConnected (:1687-1699), so no promise is dropped and nothing can outlive its caller to reconnect a closed adapter."
---

# The SQLite3 constructor fires configure_connection un-awaited, so a deferred query can resurrect a closed connection

## Context

Surfaced on PR #7280 while converging `get_database_version`; it is the blocker
recorded on `sqlite-get-database-version-uses-query-value`.

Rails runs `configure_connection` to completion inside `connect`, on an open raw
connection — `AbstractAdapter#connect!` -> `verify!` -> `reconnect` ->
`configure_connection`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:759-766,
:829-836`), and `configure_connection` ends in `check_version`
(`abstract_adapter.rb:836`).

trails cannot: `SQLite3Adapter`'s constructor is synchronous, so it fires

```ts
if (!this._asyncConnectPending) void this.configureConnection();
```

(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:297`) and
drops the promise. Nothing awaits it, nothing can report its rejection, and —
the sharp edge — nothing stops it running after the caller has finished with the
adapter.

That is latent today only because `check_version`'s probe is currently a
driver-side read that resolves in the same tick. The moment
`get_database_version` becomes Rails' `query_value("SELECT sqlite_version(*)",
"SCHEMA")` (`sqlite3_adapter.rb:476-478`), the probe becomes a real query on the
`rawExecute -> ensureConnected` path, and `ensureConnected`
(`sqlite3-adapter.ts:1821-1824`) **reconnects** via `verifyBang`. A probe still
in flight when its caller disconnects therefore reopens the connection it was
told to close.

Measured on #7280 with only `get_database_version` converged — all five AR
lanes red, on tests with nothing to do with the version chain:

- `connection-pool.test.ts:452` — `isConnected()` is `true` after
  `disconnectBang()`
- `with-transactional-fixtures.trails.test.ts:77,120` — a fixture row survives
  rollback, then `database is locked`
- `transactions.trails.test.ts:173,184` — savepoint statements stop dirtying the
  parent frame
- `sqlite3-adapter-perform-query.trails.test.ts:157,179` — statement-lock
  reordering, an INSERT landing on a reopened empty `:memory:` db

Isolated to this cause: stubbing `getDatabaseVersion` to a constant, with every
other change on that branch intact, turns all five green. Three containments
were tried and each moved the failure elsewhere — deferring the call to a
microtask (reds the pragma tests, which depend on the sync-start), gating on
`isOpen` before starting (the probe starts open and resumes closed), and
catching the rejection (hides it, does not stop the reconnect).

Closely related: `sqlite3-adapter-connects-eagerly-in-constructor` (same RFC)
removes the constructor's `connect()`. If that lands first, this may collapse
into it — the configure has nothing to run against — so check there before
starting.

## Converged shape

The constructor must not own an un-awaitable configure. Either the adapter
exposes the deferred configure as an awaitable the pool drains before handing
the connection out (the shape `completeAsyncConnect` / `adapterReady` already
has for the async-driver path), or the configure moves onto `connect!`/`verify!`
where Rails runs it and the constructor stops doing it at all.

Whichever shape wins, the invariant to hold is: **no query started by
`configure_connection` may outlive an explicit `disconnectBang`**, and none may
reconnect through `ensureConnected`.

## Acceptance criteria

- [ ] `configure_connection`'s version probe cannot reconnect an adapter
      disconnected while it was in flight.
- [ ] `SQLite3Adapter#getDatabaseVersion` can then be Rails'
      `Version.new(query_value("SELECT sqlite_version(*)", "SCHEMA"))`
      (`sqlite3_adapter.rb:476-478`) with the five test sites above green, and
      `sqlite-get-database-version-uses-query-value` unblocks.
- [ ] The `@missingRailsCall query_value — CONVERGEABLE
sqlite-get-database-version-uses-query-value` receipt at
      `sqlite3-adapter.ts:831` is deleted with it.
- [ ] A test pins the invariant: a probe in flight across a `disconnectBang`
      leaves the adapter closed.
