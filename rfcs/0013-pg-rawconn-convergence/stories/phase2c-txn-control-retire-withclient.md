---
title: "Phase 2c — txn-control + DDL sites, retire withClient bespoke reconnect"
status: draft
rfc: "0013-pg-rawconn-convergence"
cluster: pg-rawconn-convergence
deps:
  - phase2b-write-path
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Final Phase 2 slice: bring the remaining transaction-control and DDL sites onto
`withRawConnection`, then **delete `withClient`** now that every caller goes
through the base loop (whose `isRetryableConnectionError` branch drives recovery
via the inherited `reconnectBang` → PG `reconnect()` override → lazy
`getClient()` re-acquire — there is no PG `reconnectBang` override).
`withClient` has no Rails counterpart (Rails has only `with_raw_connection`
yielding `@raw_connection`), so it is removed outright — not thinned.

See this RFC's §Delete `withClient` entirely and §Open questions (3, resolved).

## Acceptance criteria

- [ ] `createSavepoint` / `releaseSavepoint` / `rollbackToSavepoint` run on the
      in-transaction client through the appropriate (non-re-entrant) path; they
      do NOT independently materialize.
- [ ] `exec` (raw DDL, ~2041) and `disableExtension` (~2812) routed through
      `withRawConnection` (materialize = true). (Note: the RFC's old "dropExtension"
      name was wrong — the site is `disableExtension`.)
- [ ] `reconfigureConnectionTimezone` (~5251) and `getDatabaseVersion`
      (~2384/2391) stay **OFF** `withRawConnection`, on a direct `getClient()`
      path. Reason (corrected from the old "acquisition-time" framing):
      `reconfigureConnectionTimezone` is called from `performQuery` via
      `updateTypemapForDefaultTimezone` — i.e. _already inside_ a
      `withRawConnection` scope, so routing it would re-enter `_lockQueue` and
      deadlock; `getDatabaseVersion` is a memoized bootstrap probe. See RFC
      §Site inventory (last two rows).
- [ ] `withClient` method **deleted**; its acquire role folded into
      `rawConnectionForBlock`, its `_isConnectionError → this.reconnect()`
      superseded by the base loop's `isRetryableConnectionError` → inherited
      `reconnectBang` → PG `reconnect()` override → lazy `getClient()` re-acquire.
      `getClient` / `_acquireFreshClient` retained as the lazy-connect primitive.
      No path loses connection-error recovery (asserted by test).
- [ ] Unskip the two PG-specific mirrors in
      `adapters/postgresql/postgresql-adapter.test.ts` (lines 744 and 1249 — see
      RFC §Verification table). These exercise the `getDatabaseVersion` /
      `check_version` reconnect path and **prove the PG path end-to-end** — 2c is
      NOT done until both are green under the PG adapter dir.
- [ ] Unskip the `#configure_connection` recovery mirror in `adapter.test.ts`
      (line 585 — see RFC §Verification table).
- [ ] `pnpm tsc --build` clean; touched test files pass; locking + transactions
      adapter dirs green under `RUN_ADAPTER_DIRS=1 PG_TEST_URL=... AR_DB_FORKS=1`.

## Notes

Resolves RFC §Open question 3 (delete `withClient` — no Rails equivalent).
Sequential after 2b; branch from updated `main`; do not stack. The trap here is
the two off-loop sites: `reconfigureConnectionTimezone` runs _inside_
`performQuery` (already within a `withRawConnection` scope, so routing it
re-enters `_lockQueue`), and `getDatabaseVersion` is a memoized bootstrap probe —
both keep a direct `getClient()` path. See RFC §Site inventory.
