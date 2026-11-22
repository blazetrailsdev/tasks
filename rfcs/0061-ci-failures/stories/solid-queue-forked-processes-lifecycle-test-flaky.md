---
title: "solid-queue-forked-processes-lifecycle-test-flaky"
status: ready
updated: 2026-11-22
rfc: "0061-ci-failures"
cluster: null
packages: []
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

`packages/solid-queue/test/integration/forked-processes-lifecycle.test.ts` (`ForkedProcessesLifecycleTest`) failed on two adapter lanes in one run on trails#10513. That PR only touches a parity operator map and two JSDoc receipts in `packages/pg/lib/result.ts`.

- MariaDB shard 3/3 (run 44937780462, job 136948276479): "process some jobs that raise errors", "process a job that exits", "kill worker individually". The log also shows `Mysql2::Error: Deadlock found when trying to get lock` and `TypeError: Cannot read properties of undefined (reading 'splice')`.
- PostgreSQL shard 2/3 (job 136948276453): "int supervisor while there are jobs in-flight", "kill worker individually", "terminate worker individually".

The Rails counterpart is `solid_queue/test/integration/forked_processes_lifecycle_test.rb`.

## Acceptance criteria

- [ ] Find the cause of the intermittent failures: supervisor/worker timing, the deadlock on MariaDB, and the undefined `splice` receiver.
- [ ] Fix it without retries or longer timeouts that would mask it. The test class passes reliably on the SQLite, PostgreSQL and MariaDB lanes.
