---
title: "PG disconnect!/close in-flight acquire adoption race (generation token)"
status: claimed
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-07-13T18:58:23Z"
assignee: "pg-disconnect-close-inflight-acquire-adoption-race"
blocked-by: null
---

## Context

PR #4303 (story adapter-discardbang-abandon-handle-not-close) hardened the PG
adapter against a connect/teardown race for `discardBang()` only, using a
per-acquire generation token: `discardBang` records the in-flight acquire's
generation in `_discardedAcquireGenerations` and bumps `_acquireGeneration`, so
`_acquireFreshClient` stops reusing the orphaned acquire and the resolving
connect abandons its socket instead of adopting/closing it
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`
`_doAcquire`/`_acquireFreshClient`/`discardBang`).

The SAME adoption race exists for `disconnectBang()` and `close()`, which were
deliberately left out of PR #4303's scope: they set `_closed = true` but do NOT
bump `_acquireGeneration`. If an in-flight `_doAcquire()` is suspended at
`await PostgreSQLAdapter.newClient(...)` when `disconnectBang()`/`close()` runs,
and then a checkout `verifyBang()` → `reconnectBang()` → `reconnect()` →
`_discardRawConnection()` clears `_closed` before the connect resolves, the
stale `_doAcquire` reaches its teardown guards with `_closed === false` and can
publish (adopt) the pre-disconnect `newClient` at
`postgresql-adapter.ts:1182-1188` instead of tearing it down. This is
pre-existing behavior (predates PR #4303) and is the disconnect/close analogue
of the discard race that PR #4303 fixed.

Rails serializes `disconnect!`/`reconnect!` under `@lock.synchronize`
(`vendor/rails/.../abstract_adapter.rb`), so a reconnect cannot interleave with
an in-flight connect the way trails' async model allows.

## Acceptance criteria

- [ ] An in-flight `_doAcquire()` orphaned by `disconnectBang()` or `close()`
      does NOT adopt/publish its `newClient` after a racing reconnect clears
      `_closed`; it tears the client down (disconnect/close → `end()`, matching
      Rails) and the fresh reconnect opens a new connection.
- [ ] Reuse the existing `_acquireGeneration` mechanism (bump it in
      `disconnectBang`/`close`) rather than a second flag, keeping the discard
      path's abandon-vs-end decision intact.
- [ ] No regression to the discard race fix from PR #4303 or to
      reconnect/verify teardown tests.
