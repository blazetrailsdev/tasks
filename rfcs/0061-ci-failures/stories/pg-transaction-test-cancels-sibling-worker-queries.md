---
title: "PG transaction.test.ts cancels backends by query pattern, killing sibling workers' queries"
status: draft
updated: 2026-07-24
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Recurring CI failure on `Active Record PostgreSQL Tests` (seen on PR #5119 and
again on PR #5179, run 30047043897 shard 2): **every test file passes**, but the
job fails on a single run-end vitest `Unhandled Rejection` —
`QueryCanceled: canceling statement due to user request` — with a stack
attributed to no test:

```text
QueryCanceled: canceling statement due to user request
 ❯ build packages/activerecord/src/connection-adapters/postgresql-adapter.ts:4493:18
 ❯ PostgreSQLAdapter._translateException postgresql-adapter.ts:4543:24
 ❯ PostgreSQLAdapter.internalExecQuery postgresql-adapter.ts:1093:40
```

Suspected source (verified present, mechanism not yet proven):
`packages/activerecord/src/adapters/postgresql/transaction.test.ts:144-148`
cancels **by query pattern rather than by pid**:

```sql
SELECT pg_cancel_backend(pid) AS ok FROM pg_stat_activity
WHERE state = 'active' AND query LIKE '% FOR UPDATE'
```

On CI every vitest worker shares one PostgreSQL database, so this `WHERE`
matches any backend in the cluster running a `... FOR UPDATE` statement —
including a **sibling worker's** in-flight query. The sibling's promise rejects
with `QueryCanceled` after its own test has finished and nothing is left to
observe it, so vitest reports it as a run-end unhandled rejection and fails an
otherwise-green shard.

Note the sibling test at transaction.test.ts:76 already does this correctly:
it captures the target backend's pid and calls `pg_cancel_backend(?)` with it.
The `expect(sent.length).toBe(1)` assertion at :148 does not prevent the
collateral damage — it only checks how many rows came back.

## Acceptance criteria

- `transaction.test.ts` no longer cancels backends by query pattern: the
  "deadlock"/blocked-statement test targets the specific pid of the connection
  it created (the `pg_backend_pid()` approach already used at :76), so it can
  never cancel another worker's or another suite's query.
- The test still asserts the cancel actually landed (no silent no-op that
  degrades into a timeout) and still asserts `QueryCanceled` is raised.
- No new bespoke tables; test name unchanged (test:compare matches on it).
- Confirm on a shared-DB run (PG CI, not a local isolated stack) that the
  run-end unhandled `QueryCanceled` no longer appears.

## Notes

Until fixed, the signature — zero failing assertions + run-end unhandled
`QueryCanceled` — should be re-run (`gh run rerun <id> --failed`), not chased
inside a feature PR.
