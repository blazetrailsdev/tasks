---
title: "Phase 2 — route mysql2 execute/executeMutation/execQuery through withRawConnection"
status: in-progress
updated: 2026-06-10
rfc: "0000-mysql-rawconn-convergence"
cluster: mysql-rawconn-convergence
deps:
  - phase1-dirty-on-any-query
deps-rfc: []
est-loc: 250
priority: 1
pr: 3074
claim: "2026-06-10T01:31:18Z"
assignee: "phase2-route-data-path-through-withrawconnection"
blocked-by: null
---

## Context

The structural half of the convergence. `execute` (`mysql2-adapter.ts:714`),
`executeMutation` (`:787`), and `execQuery` (`:513`) each call
`materializeTransactions()` then run their own instrument + `try/catch` +
connection-error translation, with `invalidateTransaction(translated)` duplicated
at three sites (`:777`, `:840`, `:978`) and a hand-rolled reconnect-retry loop in
`beginIsolatedDbTransaction` (`:895`). Route the data-path methods through the
abstract `withRawConnection` loop (the `rawConnectionForBlock()` seam, as PG does
post-0013) so retry / dirty / invalidate are centralized.

See this RFC's §Site inventory, §Design (Phase 2), and §Open question 1
(re-entrancy audit).

## Acceptance criteria

- [ ] `execute` / `executeMutation` / `execQuery` acquire the raw connection via
      `withRawConnection` (one leaf scope per op), running inner SQL on the yielded
      connection — no method nests another raw-connection scope.
- [ ] The three `invalidateTransaction(translated)` sites collapse into the loop's
      terminal-failure handling (no per-method copies remain).
- [ ] `beginIsolatedDbTransaction`'s manual `reconnectBang({restoreTransactions:true})`
      retry loop is replaced by the loop's `allow_retry` path (Rails
      `execute_batch(allow_retry: true)`).
- [ ] `materializeTransactions()` + dirty-on-materialized-query are owned by the
      loop (subsumes Phase 1 if not already merged).
- [ ] `internalExecute` stays the transaction-control path
      (BEGIN/COMMIT/ROLLBACK/SET, `materializeTransactions:false`) — unchanged.
- [ ] PR body includes a call-graph note classifying each site (leaf / composite /
      off-loop) and the re-entrancy decision for the CALL/multi-result unwrap and
      the isolated-begin retry (mirror RFC 0013's requirement).
- [ ] Un-skip the Rails-mirrored retry/reconnect tests in `adapter.test.ts` and the
      mysql2 transaction tests that this restores (audit first — some may already
      pass).
- [ ] `pnpm tsc --build` clean; broad mysql2 adapter run green; touched test files
      only.

## Notes

Hot query path — highest blast radius in this RFC. Sequential after Phase 1;
branch from updated `main`; do NOT stack. If the re-entrancy reconciliation proves
larger than expected, stop and expand the RFC §Design rather than forcing a
fragile change. Run one mysql2 file at a time against a fresh `mysql:8` container.
