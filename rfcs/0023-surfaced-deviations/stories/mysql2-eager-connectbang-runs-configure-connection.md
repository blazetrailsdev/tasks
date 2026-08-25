---
title: "Mysql2Adapter eager connectBang()/connect() should run configureConnection on fresh connect (Rails parity)"
status: done
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4661
claim: "2026-07-06T04:26:23Z"
assignee: "mysql2-eager-connectbang-runs-configure-connection"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4612 (mysql2-active-sync-getter-reflects-connection-state).

`Mysql2Adapter#connectBang()` → `connect()` → `_ensureClient()`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts` ~L1369-1384,
585-665) deliberately opens the raw socket WITHOUT calling
`configureConnection()` / `attemptConfigureConnection()` — documented as an
intentional bypass ("rather than route through verify!... trails opens the raw
connection directly"). In the normal query loop the eager `connectBang()` runs
BEFORE `verifyBang()` (abstract-adapter.ts run() loop:
`if (_connection === null && isReconnectCanRestoreState()) await connectBang()`),
so for a genuinely fresh Mysql2Adapter the connection is established via the
eager path and `configureConnection()` never runs on that first connection.

Rails' `configure_connection` runs on every fresh connect (via
`new_connection`/`connect!`→`verify!`→`reconnect!`→`attempt_configure_connection`,
abstract_adapter.rb:662,759). Only trails' `reconnectBang` path
(taken after a disconnect/failure, `_activeState === false`) currently runs it.

No OBSERVABLE effect today: `Mysql2Adapter#configureConnection` (mysql2-adapter.ts
~L1607) only does `_syncDatabaseTimezone()` (which also runs per-query in the
perform-query path, ~L516) + `super.configureConnection()` → `checkVersion()`,
and trails' `checkVersion` is an empty no-op (query-cache.ts:504). So the gap is
latent — but it becomes a real deviation the moment `checkVersion` gains a real
version gate or `configureConnection` acquires any connect-time-only logic.

## Acceptance criteria

- [ ] A freshly-constructed Mysql2Adapter runs `configureConnection()` exactly
      once on its first connection, whether reached via eager `connectBang()`
      (query-loop path) or `verifyBang`/`reconnectBang` — matching Rails, which
      configures on every fresh connect with no "already connected once" skip.
- [ ] No double-configure on a connect that is immediately followed by
      verify/reconnect.
- [ ] MySQL/MariaDB CI green (adapter-gated).
- [ ] No bespoke tables; no bending of Rails assertions.
