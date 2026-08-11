---
title: "pg-query-canceled-unhandled-rejection-recurrence"
status: done
updated: 2026-08-11
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6363
claim: "2026-08-11T15:26:09Z"
assignee: "pg-query-canceled-unhandled-rejection-recurrence"
blocked-by: null
closed-reason: null
---

## Context

The run-end `QueryCanceled` unhandled-rejection flake in the PG shards is
BACK. `pg-query-canceled-unhandled-rejection` (RFC 0061) closed it on
2026-07-30 via PR #5655; it recurred on 2026-08-11 on PR #6357 (an `arel`
visitor PR touching nothing under `connection-adapters/`), run
31501468481 job 93812350132, "Active Record PostgreSQL Tests (2)".

Same signature as before — every test passes, the job still exits 1 on
vitest's post-run unhandled-error check:

```text
⎯⎯ Unhandled Rejection ⎯⎯
QueryCanceled: canceling statement due to user request
 ❯ build packages/activerecord/src/connection-adapters/postgresql-adapter.ts:3756:18
 ❯ PostgreSQLAdapter._translateException .../postgresql-adapter.ts:3806:24
 ❯ .../postgresql-adapter.ts:1125:28
 ❯ run packages/activerecord/src/connection-adapters/abstract-adapter.ts:2447:18
 ❯ TransactionManager.synchronize .../abstract/transaction.ts:1197:14
 ❯ .../postgresql-adapter.ts:1099:21
 ❯ Instrumenter.instrumentAsync .../notifications/instrumenter.ts:171:14
 ❯ PostgreSQLAdapter.log .../abstract-adapter.ts:2643:15
```

`PostgreSQLAdapter.log` is the OUTERMOST async frame, so the abandoned promise
is a `log()`-wrapped query — the caller's await was already gone when the
rejection settled. Unlike the 2026-07-30 occurrence, today's log carries NO
test attribution at all (the run's only annotation is the unhandled error), so
the owning file cannot be read off the reporter output.

## What PR #5655 established (do not re-derive)

- The three `pg_cancel_backend` TEST call sites are red herrings: each targets
  a pid it owns and attaches a handler to the query it cancels. Looping them
  locally never reproduced it.
- The real cancel came from trails itself:
  `PostgreSQLAdapter#_cancelAnyRunningQuery` (`postgresql-adapter.ts:2028`),
  which opens a fresh socket and sends a libpq CancelRequest before
  `ROLLBACK` / `ROLLBACK AND CHAIN` / `resetBang`.
- #5655's fix narrowed it to "only cancel an in-flight query the rolling-back
  chain owns". That narrowing is evidently not tight enough, or a second
  path reaches the same place.

## First thing to look at

`_cancelAnyRunningQuery`'s ownership gate is
`this._rawConnection == null || IDLE_TRANSACTION_STATUSES.includes(this.transactionStatus)`,
and `transactionStatus` (`postgresql-adapter.ts:1983`) decides PQTRANS_ACTIVE
from the heuristic `client.readyForQuery !== true && !this._commandSettled`.
`_commandSettled` is maintained from `readyForQuery` / `commandComplete` /
`errorMessage` events on the pg Connection (`:2005-2018`). If that heuristic
reads "active" for a statement the rolling-back chain does NOT own — a query
issued on the same pooled client by a different logical caller, or one that
starts in the window between the status read and the CancelRequest landing —
the CancelRequest hits a query whose promise is awaited somewhere that has
already gone away. The gate is a race-prone sampling of connection state, not
an ownership proof, which is the shape that would survive #5655's narrowing.

## Ruled out this session (2026-08-11, by inspection, not repro)

- The cancellation tests in `adapters/postgresql/transaction.test.ts` attach
  `.catch()` at query creation (`:75`), so they are not the orphan.
- `internalExecQuery` awaits `this.log(...)` (`postgresql-adapter.ts:1086`).
- The `_inFlightReset` barrier chain already terminates in `.catch(() => {})`
  (`postgresql-adapter.ts:2789`), so a rejected deferred ROLLBACK/DISCARD ALL
  is not it.
- `withRawConnection`'s retry loop rethrows rather than spawning a second
  promise (`abstract-adapter.ts:2445-2477`).

## Acceptance criteria

- Root cause identified WITH EVIDENCE — instrument `_cancelAnyRunningQuery`
  (as #5655 did) and reproduce locally against PG in an isolated compose
  project, looping the shard if needed. A guess does not close this.
- The cancel can only ever land on a query the cancelling chain owns, proven
  rather than sampled; or the cancelled query's rejection is observed at its
  source. Document the invariant at the call site.
- Do NOT suppress it with a global `process.on("unhandledRejection")` handler
  or by loosening vitest's unhandled-error reporting — that hides real bugs.
- Test names unchanged (they are `parity:test` keys).
- Verified by ≥20 repeat runs of the affected PG files with no unhandled
  rejection, plus a green full PG shard in CI.
- Update `pg-query-canceled-unhandled-rejection`'s story body to point here,
  so the closed story does not read as a settled fix.
