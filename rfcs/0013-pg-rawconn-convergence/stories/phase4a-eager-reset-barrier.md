---
title: "Make PG's async reset barrier (_inFlightReset + post-reset configure) eager-compatible so the rawConnectionForBlock seam can be deleted"
status: draft
updated: 2026-06-12
rfc: "0013-pg-rawconn-convergence"
cluster: pg-rawconn-convergence
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Precursor to `phase4-async-connectbang-eager-reconnect`, surfaced during that
story's implementation (investigated against live PG, 2026-06-12). Phase 4 set
out to delete PG's `rawConnectionForBlock` seam by making acquisition eager in
both the connect and reconnect paths. It identified **two** structural blockers
(sync `connectBang` vs. async/lazy PG acquisition; the retry loop re-yielding
after `reconnectBang`). Both were implemented and work. But a **third**
structural blocker — not enumerated in the Phase-4 story — makes the seam
deletion regress correctness, hitting Phase 4's own criterion-6 STOP clause.

### The third blocker: PG's async reset barrier

Rails' `reset!` runs `ROLLBACK` + `DISCARD ALL` as blocking libpq calls, so by
the time `reset!` returns the connection is fully scrubbed. trails'
`resetBang()` is **synchronous** and cannot block, so it defers `DISCARD ALL`
behind a `.then` promise stored in `_inFlightReset`, and relies on the **next**
`_acquireFreshClient()` to:

1. `while (this._inFlightReset) await this._inFlightReset;` — drain the pending
   `ROLLBACK` + `DISCARD ALL` before any query runs, and
2. re-run `configure_connection` (`resetBang` sets `_connectionConfigured =
false`, so the next acquire reconfigures the scrubbed session).

The `rawConnectionForBlock` → `getClient` → `_acquireFreshClient` seam invokes
this drain+reconfigure on **every** loop iteration, **unconditionally**. The
proposed base seam `return this._connection` bypasses it entirely — it yields a
`pg.Client` with `DISCARD ALL` still queued behind the about-to-run query.

**Confirmed regression:** with the seam replaced by `return this._connection`,
`PostgresqlConnectionTest > reset with transaction` fails — after
`beginTransaction()` + `resetBang()`, `SHOW geqo` returns `'off'` (expected
`'on'`); the `DISCARD ALL` that resets the GUC hadn't landed yet. Restoring a
seam that delegates to `_acquireFreshClient()` → all 34 tests pass. (The plain
`reset` case without a transaction happens to pass by socket-ordering luck; the
transactional case does not.)

### Why the eager pre-loop `connectBang()` can't absorb the drain

The drain must be **unconditional** per use. The base pre-loop `connectBang()`
is gated by `isReconnectCanRestoreState()`, which is **false** after a
real-transaction reset (the TM still holds the open transaction — `resetBang`
deliberately does NOT reset the transaction manager). So broadening the pre-loop
guard does not cover the failing path. An unconditional async readiness step in
the loop is, structurally, the seam by another name.

A faithful deletion therefore requires reworking the reset lifecycle itself —
not just the connect/reconnect paths — which was out of scope for Phase 4 and
likely exceeds its 300-LOC ceiling. Per Phase 4's criterion 6, Phase-3's seam is
the acceptable resting point until this story lands.

### The eager `connectBang`/`reconnect` work (Phase 4) is a real prerequisite

The Phase-4 changes (async `connectBang` on the base; PG eagerly populating
`_connection` in `connectBang` and `reconnect`, mirroring Rails `connect!` /
`reconnect` setting `@raw_connection`) are correct and are a prerequisite for
the seam deletion — but they are pointless to ship while the seam must stay (the
seam re-acquires every iteration regardless, making them redundant). Fold them
into this story so they land together with the reset-barrier rework.

## Acceptance criteria

- [ ] Make PG's async reset (`resetBang`'s deferred `ROLLBACK` + `DISCARD ALL`
      via `_inFlightReset`, plus the post-reset `configure_connection` re-run)
      compatible with eager acquisition, so a connection yielded by the base
      `withRawConnection` loop is guaranteed drained + reconfigured WITHOUT a
      per-iteration `rawConnectionForBlock` → `_acquireFreshClient` call.
      Options to evaluate: (a) have `resetBang` itself eagerly re-prime
      `_connection` (analogous to Phase 4's eager `reconnect`), reusing the same
      `pg.Client` socket; (b) reset the transaction-manager restorability in the
      reset path so the pre-loop eager `connectBang` becomes the unconditional
      drain point; (c) another approach that keeps `ROLLBACK` → `DISCARD ALL`
      ordering and socket identity.
- [ ] Land the Phase-4 eager-connect/eager-reconnect work: `connectBang()`
      async on `AbstractAdapter` (base no-op stays a no-op; SQLite/MySQL inherit
      unchanged); PG overrides `connectBang()` to eagerly populate
      `this._connection`; PG `reconnect()` repopulates `_connection` eagerly.
- [ ] PG's `rawConnectionForBlock` override **deleted**; the base loop yields
      `this._connection` for PG. (`Mysql2Adapter` still overrides — the base
      seam stays.)
- [ ] `getClient()` reduced to a thin accessor of `_connection` (or removed
      where callers can read `_connection` directly); no caller depends on a
      lazy second-acquire path.
- [ ] Statement-pool and `configure_connection` lifecycle stay correct under
      eager acquisition (no double-open, race-guard preserved, `DISCARD ALL`
      ordering preserved, socket identity preserved across reset).
- [ ] Consider the pre-existing `connected?` `finished?` fidelity gap deferred
      from Phase 3/4 (Rails PG `connected?` is `!(@raw_connection.nil? ||
@raw_connection.finished?)`; trails base `isConnected()` only checks
      `_connection !== null`). Fold in here or split to its own story.
- [ ] `pnpm tsc --build` clean; PG adapter dirs (connection, transaction,
      transaction-nested, statement-pool, money) green under ARCONN=postgresql +
      live PG — in particular `PostgresqlConnectionTest > reset` and
      `> reset with transaction`; Phase-2/3 retry/reconnect mirrors stay green;
      api:compare and test:compare deltas non-negative.

## Notes

- Repro for the regression (the test that gates this story), with the seam
  replaced by `return this._connection`:

  ```sh
  ARCONN=postgresql PG_TEST_URL=<url> pnpm vitest run \
    packages/activerecord/src/adapters/postgresql/connection.test.ts \
    -t "reset with transaction"
  ```

- Live PG locally: the default `postgres://localhost:5432/rails_js_test` host
  port is often occupied by other services; start a throwaway container on an
  alt port and pass `PG_TEST_URL`.
- The reset barrier lives in `postgresql-adapter.ts`: `_inFlightReset`
  (declared ~L297), drained in `_acquireFreshClient`
  (`while (this._inFlightReset) ...`), set up in `resetBang`
  (the `work.then(() => live.query("DISCARD ALL"))` chain).
- Hard rules carried from Phase 4: NO `node:*` imports; NO `process.*`; async fs
  only; no new runtime deps; 300-LOC ceiling; no stacked PRs; single PR from
  main; test names match Rails verbatim; camelCase only; draft PR; run `/link`
  after opening.
