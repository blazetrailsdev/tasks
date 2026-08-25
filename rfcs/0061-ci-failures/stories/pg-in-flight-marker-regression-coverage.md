---
title: "Find a discriminating regression test for the PG in-flight marker ownership guard"
status: closed
updated: 2026-07-30
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5667
claim: null
assignee: null
blocked-by: null
closed-reason: "wontfix"
---

## Context

PR #5660 moved the PG in-flight query marker (`_queryInFlight` /
`_queryInFlightOwner`) out of `_runQuery` entry and into `_serializePinnedQuery`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1519-1537`),
so the marker is claimed when the query actually reaches the wire rather than
while it is still queued behind a foreign query. It shipped as a structural
correction with **no regression test**, because no construction found so far
discriminates pre- from post-fix.

Three attempts all passed on the pre-fix code and were therefore dropped
(documented in #5660's body):

1. Two public `execute` calls on one adapter — `TransactionManager.synchronize`
   serializes them end-to-end, so the second never reaches `_runQuery` while the
   first is on the wire.
2. Same, with `_cancelAnyRunningQuery` instrumented — it was entered with
   `_queryInFlight === false`; acquiring the TM lock for the rollback body meant
   waiting out the `pg_sleep`.
3. Foreign `pg_sleep(1)` issued outside the TM lock, then a same-chain `execute`
   launched un-awaited inside `transactionManager.synchronize` to queue behind
   it, then `rollbackDbTransaction()`. The inner `execute` blocks acquiring the
   TM lock the enclosing `synchronize` already holds, so it never reaches
   `_runQuery` before the rollback runs.

The overlap the serializer exists to prevent (its own docblock: "two calls that
interleave desync the wire protocol") arises on internal/reentrant paths —
`withRawConnection`'s reentrant branch, or a chain that releases the TM lock with
work still awaiting (the SAVEPOINT-vs-rollback case #5655 diagnosed) — not
through public `execute`. Those paths were not exhausted.

The guard being protected lives at `postgresql-adapter.ts` ~2237-2239
(`_cancelAnyRunningQuery`). Rails scopes this via
`@connection.lock.synchronize` around `cancel_any_running_query`
(`activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:611`
→ `.../postgresql/database_statements.rb:127`).

## Acceptance criteria

- Either land a regression test that **fails on the pre-#5660 marker placement
  and passes after it**, built from an internal/reentrant construction
  (`withRawConnection`'s reentrant branch, or a chain that releases the TM lock
  with work still in flight) — verify both directions explicitly, e.g. by
  reverting `postgresql-adapter.ts` to the parent commit of #5660.
- Or, if the reentrant paths are also shown not to discriminate, record the
  exhausted list in a code-adjacent note and close this story as `wontfix` —
  do **not** ship a test that passes on both sides.
- No time-based assertion that can flake on a loaded CI host beyond the margins
  already used by the neighbouring cancel tests in
  `packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts`.
