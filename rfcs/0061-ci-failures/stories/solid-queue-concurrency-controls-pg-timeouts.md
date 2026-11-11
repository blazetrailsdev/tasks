---
title: "solid-queue-concurrency-controls-pg-timeouts"
status: draft
updated: 2026-11-11
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

`packages/solid-queue/test/integration/concurrency-controls.test.ts` (ported in trails#9988, 876804dd8b, from `solid_queue/test/integration/concurrency_controls_test.rb`) times out on the Active Record PostgreSQL Tests (3) shard: 8 tests hit `Test timed out in 30000ms` and the hooks hit `Hook timed out in 30000ms`, starting at `run several conflicting jobs over the same record sequentially` (line 93).

Seen on run 43062155456, job 130667758835 (PR #9996, which changes only the media-binaries CI action). Until #9996 lands, main's AR shards failed earlier at the media-binaries step, which is probably why this has not shown on main yet.

Affected tests: run several conflicting jobs over the same record sequentially; schedule several conflicting jobs over the same record sequentially; run several jobs over the same record limiting concurrency; run several jobs over the same record sequentially, with some of them failing; rely on dispatcher to unblock blocked executions with an available semaphore; rely on dispatcher to unblock blocked executions with an expired semaphore; don't block claimed executions that get released; verify transactions remain valid after Job creation conflicts via limits_concurrency.

## Acceptance criteria

- Find out whether the timeout is deterministic on PostgreSQL or a flake (rerun, and run the file locally against the PG compose stack).
- Fix the root cause (worker/dispatcher not processing jobs, a lock wait, or an unawaited promise) so the file passes on PostgreSQL within the default timeout.
- Do not raise the test timeout or skip the tests to get green.
