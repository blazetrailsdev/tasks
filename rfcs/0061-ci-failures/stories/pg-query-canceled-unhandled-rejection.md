---
title: "Eliminate the run-end QueryCanceled unhandled-rejection flake in PG shards"
status: done
updated: 2026-07-30
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5655
claim: "2026-07-30T17:53:05Z"
assignee: "pg-query-canceled-unhandled-rejection"
blocked-by: null
closed-reason: null
---

> **Superseded — this fix was not the whole story.** The same run-end
> `QueryCanceled` unhandled rejection recurred on 2026-08-11 (PR #6357, run
> 31501468481). Root cause, found by
> `pg-query-canceled-unhandled-rejection-recurrence`: `_cancelAnyRunningQuery`
> fired the libpq CancelRequest on a detached socket and returned without
> waiting, so the cancel landed on whatever query was on the wire milliseconds
> later (measured 25/25 against PG 17). Rails' `cancel` + `block`
> (postgresql/database_statements.rb:130-131) both block; the port had dropped
> `block` entirely. See that story for the fix.

## Context

"Active Record PostgreSQL Tests" shards fail intermittently with **every test
passing** and a single run-end vitest failure:

```text
⎯⎯ Unhandled Rejection ⎯⎯
QueryCanceled: canceling statement due to user request
 ❯ build packages/activerecord/src/connection-adapters/postgresql-adapter.ts:4448:18
 ❯ PostgreSQLAdapter._translateException .../postgresql-adapter.ts:4498:24
 ❯ .../postgresql-adapter.ts:1082:28
 ❯ run packages/activerecord/src/connection-adapters/abstract-adapter.ts:2327:18
 ❯ TransactionManager.synchronize .../abstract/transaction.ts:1204:14
 ❯ PostgreSQLAdapter.internalExecQuery .../postgresql-adapter.ts:1052:40
```

Most recently on PR #5647 run 30564528294, shard 2 (a registry file-move PR
that touches nothing PG-related); previously on PR #5119. The rejection is
attributed to no test, so it cannot be chased from the reporter output — it is
a promise that outlives the test that created it, or a query cancelled in a
_sibling_ worker sharing the CI database.

Three call sites issue `pg_cancel_backend` (all currently target an exact pid,
so the older "cancels by `query LIKE '% FOR UPDATE'` pattern" theory is stale
and should not be assumed):

- `packages/activerecord/src/adapters/postgresql/transaction.test.ts:163`
  ("raises QueryCanceled when canceling statement due to user request") —
  cancels `otherPid` after polling `pg_stat_activity`.
- `packages/activerecord/src/adapters/postgresql/postgresql-adapter.trails.test.ts:266`
  ("translate exception query cancelled") — cancels a `pg_sleep(10)` by pid;
  the sleep promise is detached with a bare `.catch(() => {})` before being
  awaited.
- `packages/activerecord/src/adapter.test.ts:178`
  (`killConnectionFromServer`, mirrors Rails `AdapterConnectionTest`) —
  cancels a pooled connection id from a second checked-out connection.

Each of these leaves a cancelled query whose rejection may settle after its
test has finished, which is exactly the shape vitest reports as an unhandled
rejection at run end.

## Acceptance criteria

- Root cause identified: determine which call site (or cross-worker
  interaction on the shared CI database) produces the unobserved
  `QueryCanceled`, with evidence — not a guess. Reproduce locally against PG
  by running the candidate files together (isolated compose project), looping
  if needed.
- The rejection is observed or prevented at its source: the cancelled query's
  promise is awaited/attached within the test that triggers the cancel, and
  any adapter left holding an in-flight cancelled query is closed before the
  test completes. Do not suppress it with a global
  `process.on("unhandledRejection")` handler or by loosening vitest's
  unhandled-error reporting — that hides real bugs.
- If the cause is genuinely cross-worker (one worker cancelling a backend
  belonging to another worker's connection on the shared database), scope the
  cancel so it can only ever hit a pid this test owns, and document the
  invariant at the call site.
- Test names are unchanged (they are `parity:test` keys); the fix is in test
  setup/teardown or the adapter, not in renaming or deleting tests.
- Verified by running the affected PG test files repeatedly (≥20 iterations)
  with no unhandled rejection, plus a green full PG shard in CI.
- Delete or rewrite the now-inaccurate "cancels by pattern" mechanism note if
  the investigation contradicts it.
