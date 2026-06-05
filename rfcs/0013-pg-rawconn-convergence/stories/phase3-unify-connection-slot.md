---
title: "Phase 3 — unify PG connection onto the single _connection slot (delete the seam)"
status: ready
updated: 2026-06-05
rfc: "0013-pg-rawconn-convergence"
cluster: pg-rawconn-convergence
deps:
  - phase2c-txn-control-retire-withclient
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The faithful end state. After Phase 2 the PG path _behaves_ like Rails (one
`withRawConnection` loop at the leaf), but the `rawConnectionForBlock()` seam has
no Rails counterpart: Rails' `with_raw_connection` does `yield @raw_connection`
directly — the single connection ivar — for every adapter, and adapters
customize acquisition only via `connect!` / `reconnect!`, which populate that
same ivar. trails has the seam only because PG keeps its live connection in a
separate `_rawConnection` slot (reached via `getClient()`) rather than the base
`_connection` slot the loop yields by default.

This story collapses PG onto the single slot so trails mirrors Rails 1:1. See
this RFC's §Faithful end state — unify the connection slot (Phase 3).

## Acceptance criteria

- [ ] PG `connectBang`/`connect` override populates `this._connection` with the
      live `pg.Client` (moving `_acquireFreshClient`'s connect + configure +
      reset-drain + statement-pool + race-guard logic), mirroring Rails
      `connect!` setting `@raw_connection`. PG `reconnect()` (nulls the handle)
      is the `reconnect!` analogue.
- [ ] PG's `rawConnectionForBlock` override **deleted**; the base loop yields
      `this._connection` for PG as it does for every other adapter.
- [ ] If no adapter overrides it after this, **delete the `rawConnectionForBlock`
      seam** from `abstract-adapter.ts` and restore the inline
      `connectBang`-if-null + `yield this._connection` (matching Rails' direct
      `yield @raw_connection`).
- [ ] `getClient()` / `_rawConnection` retired as a parallel slot (or reduced to
      thin internal accessors of `_connection`); no remaining caller depends on a
      second connection slot.
- [ ] Base helpers that read `_connection` (`active`, `validRawConnection`,
      `_lastActivity`, `secondsSinceLastActivity`) now work for PG without
      PG-specific shims — drop any shim that existed only because `_connection`
      was null on PG.
- [ ] `pnpm tsc --build` clean; touched test files pass; PG adapter dirs (money,
      transactions, locking) green under the adapter-dir env (RUN_ADAPTER_DIRS /
      PG_TEST_URL / AR_DB_FORKS); the Phase-2 reconnect/retry mirrors stay green.

## Notes

Larger blast radius than Phase 2 — touches the PG connection lifecycle and every
former `getClient()` consumer. **Likely exceeds the 500-LOC PR ceiling** (it moves
`_acquireFreshClient` into `connectBang`, rewires the remaining `getClient`
callers, deletes the seam, and drops shims), so plan to split via
`<base>`/`<base>b`: 3a populates `_connection` and deletes PG's
`rawConnectionForBlock` override; 3b deletes the base seam and retires
`getClient`/`_rawConnection`. Decide the split once the call-site count is known.
Depends on 2c (which deletes `withClient`, the first `getClient` consumer).
Behavior must stay identical — this is a structural unification, not a behavior
change; the Phase-2 retry/reconnect test mirrors are the regression guard. Branch
from updated `main`; do not stack. If unification destabilizes the statement-pool
or configure-connection lifecycle, stop and expand the RFC rather than forcing it
— Phase 2's seam is an acceptable resting point.
