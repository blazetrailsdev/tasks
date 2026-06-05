---
title: "Phase 2b — PG write/mutation path through withRawConnection"
status: draft
updated: 2026-06-04
rfc: "0013-pg-rawconn-convergence"
cluster: pg-rawconn-convergence
deps:
  - phase2a-read-path
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

With the read path and re-entrancy seam landed in 2a, route the PG write/mutation
sites onto `withRawConnection` so they gain retry/verify/reconnect. These include
the re-entrant composite paths (savepoint nesting, INSERT+currval) that motivate
the re-entrancy design.

See this RFC's §Design (composite classification) and §Verification.

## Acceptance criteria

- [ ] `execUpdate` / `execDelete` routed through `withRawConnection` (materialize
      = default true).
- [ ] `executeMutation` routed through `withRawConnection` taking the lock ONCE
      at the outer scope; its savepoint nesting (RETURNING-failure retry) runs on
      the already-yielded connection WITHOUT re-entering `withRawConnection`.
- [ ] `execInsert` both paths (RETURNING and legacy `INSERT` + `SELECT
currval(...)`) route through a single leaf scope; the currval lookup does
      not take its own lock.
- [ ] Unskip the Rails-mirrored `adapter.test.ts` test `#execute is retryable`
      (write-path retry; audit first — may already pass post-Phase-1).
- [ ] Unit test (not Rails-covered): a savepoint-inside-mutation does NOT
      deadlock on `_lockQueue`.
- [ ] `pnpm tsc --build` clean; touched test files pass; transactions + RETURNING
      inserts green under `RUN_ADAPTER_DIRS=1 PG_TEST_URL=... AR_DB_FORKS=1`.

## Notes

This is the riskiest phase — the composite re-entrant sites live here. If the
re-entrancy approach chosen in 2a does not cleanly cover INSERT+currval or
savepoint nesting, stop and revisit the RFC Design. Sequential after 2a; branch
from updated `main`; do not stack. Do NOT touch `withClient` bespoke reconnect
(2c).
