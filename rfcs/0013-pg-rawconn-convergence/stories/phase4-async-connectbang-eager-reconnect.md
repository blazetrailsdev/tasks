---
title: "Phase 4 — async connectBang + eager PG reconnect to delete the rawConnectionForBlock seam"
status: claimed
updated: 2026-06-24
rfc: "0013-pg-rawconn-convergence"
cluster: pg-rawconn-convergence
deps: ["phase3-unify-connection-slot"]
deps-rfc: []
est-loc: 400
priority: 12
pr: null
claim: "2026-06-24T15:24:02Z"
assignee: "phase4-async-connectbang-eager-reconnect"
blocked-by: null
---

## Context

Completes the unification Phase 3 stopped short of. Phase 3
(`phase3-unify-connection-slot`, PR #3090) collapsed PG's `_rawConnection`
onto the single base `_connection` slot but **retained PG's async
`rawConnectionForBlock` seam** — because deleting it is not a pure
slot-rename. Two structural facts block the deletion, both confirmed against
the Rails source during the Phase-3 review:

1. **`connectBang` is synchronous; PG acquisition is async + lazy.** Rails'
   `with_raw_connection` (abstract_adapter.rb:985) does
   `connect! if @raw_connection.nil?` then `yield @raw_connection` directly.
   `connect!` → private `connect` synchronously sets
   `@raw_connection = new_client(...)`. trails' `connectBang()` is sync and
   PG's `connect()` is a deliberate no-op (the real `pg.Client.connect()` +
   `configure_connection` run async inside `_acquireFreshClient`), so the
   base default seam `return this._connection` would yield `null` for PG.

2. **The retry loop re-yields after `reconnectBang`.** Rails' `reconnect`
   repopulates `@raw_connection` synchronously (`@raw_connection&.reset` /
   `connect unless @raw_connection`). trails' PG `reconnect()` is _lazy_ — it
   nulls the handle and re-acquires on the next `getClient()`. So even if the
   pre-loop connect populated `_connection`, after a retry's `reconnectBang`
   the base `yield this._connection` would see `null`. This is the actual
   reason the per-iteration async seam exists.

So eliminating the seam requires making PG acquisition **eager** in both the
connect and reconnect paths, not just renaming the slot. This is the
"destabilizes the statement-pool / configure-connection lifecycle" scope the
RFC's Phase-3 note said to defer rather than force.

## Acceptance criteria

- [ ] `connectBang()` becomes `async` on `AbstractAdapter` (base no-op stays a
      no-op; SQLite/MySQL inherit unchanged). Its sole runtime call site —
      `withRawConnection`'s pre-loop `connect! if @raw_connection.nil?`
      (abstract-adapter.ts:1841, already inside the async `run` closure) —
      becomes `await this.connectBang()`.
- [ ] PG overrides `connectBang()` to **eagerly** populate `this._connection`
      with a live, configured `pg.Client` (driving `_acquireFreshClient`'s
      connect + configure + reset-drain + statement-pool + race-guard logic),
      mirroring Rails `connect!` setting `@raw_connection`.
- [ ] PG's `reconnect()` / the reconnect path repopulates `_connection`
      eagerly (mirroring Rails `reconnect` doing `reset` / `connect unless
@raw_connection`), so a retry's `reconnectBang` + `continue` leaves a
      live handle in `_connection` for the next `yield`.
- [ ] PG's `rawConnectionForBlock` override **deleted**; the base loop yields
      `this._connection` for PG. (`Mysql2Adapter` still overrides for its own
      async acquisition, so the **base** seam stays — do not delete it unless
      MySQL is also converted.)
- [ ] `getClient()` reduced to a thin accessor of `_connection` (or removed
      where callers can read `_connection` directly); no caller depends on a
      lazy second-acquire path.
- [ ] Statement-pool and `configure_connection` lifecycle stay correct under
      eager acquisition (no double-open, race-guard preserved). If this
      destabilizes either, STOP and expand the RFC — Phase 3's seam is the
      acceptable resting point.
- [ ] Consider closing the pre-existing fidelity gap surfaced in Phase-3
      review: Rails PG `connected?` is `!(@raw_connection.nil? ||
@raw_connection.finished?)`; trails base `isConnected()` only checks
      `_connection !== null` (no `finished?`/dead-socket check). Fold the
      `finished?` analogue in here or split to its own story.
- [ ] `pnpm tsc --build` clean; PG adapter dirs (connection, transaction,
      transaction-nested, statement-pool, money) green under ARCONN=postgresql + live PG; Phase-2/3 retry/reconnect mirrors stay green; api:compare and
      test:compare deltas non-negative.

## Notes

Larger blast radius than Phase 3 and likely > the 300-LOC single-PR ceiling
once the eager-reconnect lifecycle and `getClient` retirement are included —
scope to a single PR's worth and register any remainder as a further story
rather than stacking. Behavior must stay identical; the Phase-2/3
retry/reconnect test mirrors are the regression guard. Branch from updated
`main`; do not stack.
