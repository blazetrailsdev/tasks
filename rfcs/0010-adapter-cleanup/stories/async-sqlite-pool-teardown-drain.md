---
title: "Drain async SQLite driver close() at pool-level teardown (await _closingDriver through ConnectionPool/PoolConfig)"
status: ready
updated: 2026-06-15
rfc: "0010-adapter-cleanup"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `async-sqlite-pool-sync-checkout` (PR #3261) and
`async-only-sqlite-sync-getters` (#3286). `AbstractSQLite3Adapter.disconnectBang`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1014`) runs
under a **synchronous `void` contract**, but async-only drivers (expo-sqlite /
WASM) return a `Promise` from `driver.close()`. The adapter cannot `await` there,
so it retains the in-flight close on `this._closingDriver`, chaining repeated
disconnect cycles, and `close()` later drains it (`sqlite3-adapter.ts:803`):

```ts
override disconnectBang(): void {
  super.disconnectBang();
  if (this.driver?.isOpen()) {
    const closing = this.driver.close();          // Promise for async-only drivers
    if (closing) {
      const settled = closing.catch(() => {});
      this._closingDriver = this._closingDriver
        ? this._closingDriver.then(() => settled)
        : settled;
    }
  }
  this._inTransaction = false;
}
```

The gap: `_closingDriver` is only awaited if someone calls the adapter's own
`close()`. **Pool-level teardown** — `ConnectionPool`/`PoolConfig`
`disconnect!`/`discardConnections` — calls `disconnectBang()` and considers the
connection gone, never awaiting the per-adapter `_closingDriver`. With an
async-only driver, the underlying handle may still be closing after the pool
reports teardown complete, which can leak handles or race a subsequent
reconnect/open of the same file (notably in tests that tear down and re-open an
in-memory or file DB across cases).

This was deliberately scoped out of #3261 (which covered the checkout → first
_query_ path); the pool teardown drain is a separate seam.

## Acceptance criteria

- [ ] Pool teardown (`ConnectionPool#disconnect!` / `discardConnections` /
      `PoolConfig` shutdown — locate the trails equivalents) awaits each
      adapter's pending async close before reporting teardown complete, so no
      async-only `driver.close()` is left in flight.
- [ ] Define and document the contract: either the pool exposes an async
      teardown that drains `_closingDriver`, or the adapter surfaces a
      `whenClosed()`/drain hook the pool awaits. Sync (better-sqlite3) drivers
      stay synchronous and no-op the drain.
- [ ] No regression to the sync-driver teardown path (better-sqlite3 close stays
      synchronous).
- [ ] Test coverage against the async-only stub driver used in
      `sqlite-adapter.test.ts`: tearing down a pool with an in-flight async close
      and re-opening does not leak/raze the prior handle.
- [ ] Check Rails parity: Rails' `disconnect!` is synchronous; document how the
      async-only port reconciles (the drain is a TS-async necessity, not a Rails
      divergence in observable behavior).
- [ ] If the work exceeds one ≤500 LOC PR, split the pool-API change from the
      adapter hook and register the second as a follow-up story.
