---
title: "pg-query-canceled-cancel-trace"
status: done
updated: 2026-09-15
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7769
claim: "2026-09-15T01:08:54Z"
assignee: "pg-query-canceled-cancel-trace"
blocked-by: null
closed-reason: null
---

## Context

The run-end `Unhandled Rejection: QueryCanceled: canceling statement due to user request`
recurred in `Active Record PostgreSQL Tests (2)` on main @88583d26 (run 34914036662,
job 104209801929; closed as flake under red-88583d26) after PRs #5655, #6363 and #6365.
All 7538 tests passed. The outermost frames are
`_loadSingularViaStatementCache` (`packages/activerecord/src/associations.ts:528`) →
`StatementCache.execute` → `ConnectionPool.withConnection` → `internalExecQuery` →
`PostgreSQLAdapter.log`. That's a singular association load outside any transaction,
with no test attribution.

PR #5655 found its culprit by instrumenting `_cancelAnyRunningQuery`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:1069`) locally.
That instrumentation was never committed, so a recurrence arrives with no evidence.

## Acceptance criteria

- The PG lane loads a test setup (`test-setup-pg-cancel-trace.ts`, gated on
  `ARCONN=postgresql` in `vitest.config.ts`). It records every adapter
  `_cancelAnyRunningQuery` call (time, pid, transaction status, current test/file, stack)
  in a per-worker ring buffer.
- On an unhandled `QueryCanceled`, it prints that history plus the error's SQL and the
  test running when it surfaced.
- Nothing is suppressed: vitest's own unhandled-rejection reporting still fails the run.
- Silent in a normal run.
