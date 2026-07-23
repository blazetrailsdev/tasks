---
title: "transaction.test.ts pattern-based pg_cancel_backend cancels sibling workers' queries (CI unhandled-rejection flake)"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/postgresql/transaction.test.ts:145` cancels
a blocked query by pattern: `SELECT pg_cancel_backend(pid) FROM
pg_stat_activity WHERE state = 'active' AND query LIKE '% FOR UPDATE'`. On the
shared CI database this can cancel a SIBLING worker's in-flight `FOR UPDATE`
query. Observed on PR #5119 (run 29976288962, PG shard 2): every test file
passed but the job failed on a run-end vitest "Unhandled Rejection:
QueryCanceled: canceling statement due to user request" attributed to no test.
The test already holds its own victim's pid implicitly (the `other` adapter);
Rails' equivalent cancels only its own session's thread.

## Acceptance criteria

- The cancel targets only the test's own blocked backend (e.g. capture
  `pg_backend_pid()` from `other` before blocking and cancel that pid), not a
  pg_stat_activity pattern match.
- The assertion that the cancel matched still guards against a no-op leaving
  `blocked` to time out.
