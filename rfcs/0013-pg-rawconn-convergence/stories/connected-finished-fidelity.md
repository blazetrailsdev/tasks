---
title: "Align connected?/isConnected with Rails' @raw_connection.finished? check (PG fidelity gap)"
status: claimed
updated: 2026-06-14
rfc: "0013-pg-rawconn-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-06-14T17:12:36Z"
assignee: "connected-finished-fidelity"
blocked-by: null
---

## Context

Surfaced and deliberately deferred during `phase4a-eager-reset-barrier`
(PR #3249). Rails' `PostgreSQLAdapter#connected?` is:

```ruby
def connected?
  !(@raw_connection.nil? || @raw_connection.finished?)
end
```

trails' base `AbstractAdapter#isConnected()` only checks
`this._connection !== null` (connection-adapters/abstract-adapter.ts) — it has
no analog of libpq's `PGconn#finished?`, which reports a connection object
whose underlying socket has been closed (`PQfinish`/`PQstatus == CONNECTION_BAD`
in Rails terms). So after the socket dies but before `_connection` is nulled
(e.g. a server-side `pg_terminate_backend`, a FATAL, or a half-open socket that
hasn't been torn down yet), trails reports `isConnected() === true` while Rails
would report `connected? === false`.

This was out of scope for phase4a (which reworked the reset barrier + eager
connect/reconnect) and the eager work shipped without closing it. The gap is
narrow in practice — the next query hits the dead socket, raises a connection
error, and `withRawConnection`/`verifyBang` drives `reconnectBang` to recover —
but `connected?` / `active?` callers that read the flag _without_ issuing a
query (pool health checks, `connection_pool` reaping, diagnostics) can observe
a stale "connected" state.

node-pg exposes connection liveness via `pg.Client` internals: a finished
client has ended its socket (`client._ending` / `client._connected === false`
after `end()`, or the `'end'`/`'error'` events fired). The exact predicate to
mirror `finished?` needs verifying against the `pg` version trails pins (see
`_attachNoticeListener` / the `on("error")` and `on("end")` wiring in
postgresql-adapter.ts).

## Acceptance criteria

- [ ] Define a PG-faithful "finished" predicate over the live `pg.Client`
      (socket closed / ended / errored) verified against the pinned `pg`
      version — not just `_connection !== null`.
- [ ] PG overrides `isConnected()` (or the base grows a `rawConnectionFinished()`
      hook defaulting to `false`, PG overriding it) so
      `isConnected() === !(this._connection === null || finished)`, mirroring
      Rails `connected?`. Confirm `active`/`active?` semantics stay consistent
      (PG's `verifyBang` ping vs the sync `active` getter — do not regress the
      Phase-3/4 sync-getter constraint).
- [ ] SQLite/MySQL behavior unchanged (base default `finished === false` keeps
      `isConnected()` == `_connection !== null` for them, unless their drivers
      expose a cheap liveness check worth mirroring — out of scope here).
- [ ] Test: after the socket is closed/ended underneath the adapter (without
      calling `disconnectBang`), `isConnected()` returns `false` — mirroring the
      Rails `connected?` test. Test name matches Rails verbatim.
- [ ] `pnpm tsc --build` clean; PG connection adapter dir green under live PG;
      api:compare / test:compare deltas non-negative.

## Notes

- Hard rules carried from the RFC: NO `node:*` imports; NO `process.*`; async fs
  only; no new runtime deps; camelCase only; conventional commits; draft PR;
  run `/link` after opening; single PR from main, no stacked PRs.
- Reference the Rails `connected?` / `active?` cluster in
  `connection_adapters/postgresql_adapter.rb` and the abstract
  `connected?` / `active?` in `connection_adapters/abstract_adapter.rb`.
