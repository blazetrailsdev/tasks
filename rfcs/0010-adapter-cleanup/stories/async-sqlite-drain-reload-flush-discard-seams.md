---
title: "Drain async SQLite close on remaining pool teardown seams (clearReloadableConnections / flush / discardBang / swap-discard / PoolConfig discard)"
status: done
updated: 2026-06-24
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 14
pr: 4065
claim: "2026-06-24T15:57:32Z"
assignee: "async-sqlite-drain-reload-flush-discard-seams"
blocked-by: null
---

## Context

Follow-on to `async-sqlite-pool-teardown-drain` (PR #3318), which added the
`whenClosed()` drain hook to `AbstractSQLite3Adapter`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:914`) and
wired it into **one** pool teardown seam — `ConnectionPool#disconnect`
(`connection-adapters/abstract/connection-pool.ts:829`, the
`conn.disconnectBang(); const drain = conn.whenClosed?.()` pattern).

The other pool teardown seams still call `disconnectBang()` and consider the
connection gone **without awaiting the per-adapter `_closingDriver`**, so an
async-only driver's (expo-sqlite / WASM) in-flight `driver.close()` can outlive
the reported teardown and race a subsequent re-open of the same file. The
remaining undrained seams in `connection-adapters/abstract/connection-pool.ts`:

- `clearReloadableConnections()` — line 895 (`conn.disconnectBang?.()`), plus
  its `clearReloadableConnectionsBang()` alias (line 906).
- `flush()` — line 941 (`conn.disconnectBang?.()`), plus `flushBang()` (945).
- `discardBang()` — line 860.
- swap/checkout-failure discard path — line 1623 (`pool.remove(c);
c.disconnectBang?.()` in the checkout `catch`).
- `PoolConfig` delegations (`connection-adapters/pool-config.ts:167-218`:
  `disconnectBang` / `disconnect` forward to `this._pool.*`).

The drain hook and the reference wiring already exist (#3318); this story
extends the same `whenClosed()`-await pattern to the seams above. Sync drivers
(better-sqlite3) return a resolved/no-op `whenClosed()` and stay synchronous.

## Acceptance criteria

- [ ] `clearReloadableConnections`, `flush`, `discardBang`, the swap/checkout
      discard path, and the `PoolConfig` teardown delegations drain each
      adapter's pending async close (await `whenClosed()`) before reporting
      teardown complete, mirroring the `disconnect()` wiring at
      `connection-pool.ts:829`.
- [ ] Where the seam is a synchronous `void` API (Rails parity), follow the
      #3318 contract: collect the `whenClosed()` promises and expose/await them
      via the existing async drain path rather than blocking; document the
      choice inline.
- [ ] Sync (better-sqlite3) drivers stay fully synchronous — no new awaits on
      their teardown path; `whenClosed()` no-ops.
- [ ] Test coverage against the async-only stub driver in
      `sqlite-adapter.test.ts`: for each seam, tearing down with an in-flight
      async close then re-opening the same file does not leak/race the prior
      handle.
- [ ] No regression to the sync-driver teardown paths.
- [ ] If the work exceeds one ≤500 LOC PR, split per-seam and register the
      remainder as a follow-up story (do not fan out PRs).

## Notes

Depends on the `whenClosed()` hook landed in PR #3318
(`async-sqlite-pool-teardown-drain`). Captured from that story's deferred
"remaining seams" scope.
