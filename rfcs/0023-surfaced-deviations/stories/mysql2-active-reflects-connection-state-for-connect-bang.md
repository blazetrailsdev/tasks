---
title: "Mysql2Adapter#active should reflect real connection state so connect!/reconnect! port faithfully"
status: claimed
updated: 2026-07-05
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-07-05T12:22:29Z"
assignee: "mysql2-active-reflects-connection-state-for-connect-bang"
blocked-by: null
closed-reason: null
---

## Context

Surfaced porting `mysql2_adapter_test.rb`'s `test_connection_error` /
`test_reconnection_error` (PR #4578, story
mysql2-adapter-nullpool-and-addreference-deviations). Those Rails tests call
`Mysql2Adapter.new(socket: File::NULL, ...).connect!` and `@conn.reconnect!`
and assert the raised `ConnectionNotEstablished`'s `connection_pool`.

trails could not drive them through `connect!` / `reconnect!`:

- `Mysql2Adapter#active`
  (`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`, `get active`
  ~L122) returns `!_permanentlyClosed && !_isFakeConnection && _activeState`,
  and `_activeState` defaults to `true` (~L120). So a freshly-constructed
  standalone adapter reports `active === true` before any connection attempt —
  unlike Rails' mysql2 `active?`, which pings the raw connection and returns
  false when not connected.
- Because `active` is optimistically true, `verifyBang()`
  (`abstract-adapter.ts`, `verify!` mirror) short-circuits and never takes the
  reconnect path for a fresh adapter, and trails has no eager public `connect!`
  (Rails `connect!` = `verify!; self`) — trails' `connectBang` is the raw
  connect primitive (Rails private `connect`), a no-op on mysql2.

As a result PR #4578 drove both tests through a real query (`execute("SELECT 1")`),
which forces the lazy connect and raises `ConnectionNotEstablished` carrying the
pool. The assertions are faithful, but the trigger diverges from Rails' `.connect!`.

## Acceptance criteria

- [ ] Make `Mysql2Adapter#active` reflect real connection state (false when
      there is no live `_client` / the adapter has never connected), matching
      Rails mysql2 `active?`, OR add an eager `connect!` that mirrors Rails
      (`verify!; self`) and forces a connection.
- [ ] Re-port `connection_error` / `reconnection_error` in
      `mysql2-adapter.test.ts` to drive `connect!` / `reconnect!` directly
      instead of a `execute("SELECT 1")` proxy, keeping the NullPool assertions.
- [ ] No bending of the Rails assertions.
