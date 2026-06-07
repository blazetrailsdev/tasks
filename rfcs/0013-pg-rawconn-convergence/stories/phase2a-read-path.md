---
title: "Phase 2a — PG read path through withRawConnection"
status: done
updated: 2026-06-07
rfc: "0013-pg-rawconn-convergence"
cluster: pg-rawconn-convergence
deps: []
deps-rfc: []
est-loc: 200
pr: 3000
claim: "2026-06-07T16:55:53Z"
assignee: "phase2a-read-path"
blocked-by: null
---

## Context

Phase 1 (trails #2935, merged) routed the `rawExecute → withRawConnection →
performQuery` path through the abstract retry/verify loop via the
`rawConnectionForBlock()` seam. This story starts Phase 2 with the lowest-risk
slice: the PG **read** path. The re-entrancy question is already resolved (RFC
§Re-entrancy — RESOLVED): **per-site composition, no base-loop change** — so 2a
carries no speculative "enabler", just two leaf reads.

See RFC §Site inventory (sites + lines + materialize), §Re-entrancy — RESOLVED,
and §Verification. Confirm the inventory line numbers against current `main`
before starting (they drift).

## Acceptance criteria

- [ ] Confirm §Site inventory line numbers against current `main`; note deltas in
      the PR body. Do **not** add a reentrancy guard to `withRawConnection` — the
      decision is per-site composition (RFC §Re-entrancy — RESOLVED).
- [ ] `execQuery` (postgresql-adapter.ts ~775) routed through
      `withRawConnection({ materializeTransactions: false })` — preserves the
      existing read-before-write (no-materialize) semantics.
- [ ] `explain` (~1761) routed through `withRawConnection` (verify materialize is
      `false` for this read path).
- [ ] Unskip the two 2a read-path mirrors in `adapter.test.ts` (lines 424 and
      419 — see the table in RFC §Verification for exact names); audit first, they
      may already pass post-#2935.
- [ ] Only if not covered by the above: a unit test that `execQuery` still does
      not materialize a pending lazy transaction (stub `getClient`).
- [ ] `pnpm tsc --build` clean; touched test files pass; money adapter dir green
      at `AR_DB_FORKS=1` (RFC §Test-isolation gotcha).

## Notes

The re-entrancy hazard lives in 2b/2c composites, not here — both read sites are
leaves. Do NOT touch `withClient`'s bespoke reconnect yet (2c). Sequential with
2b/2c — same file (`postgresql-adapter.ts`); do not stack.
