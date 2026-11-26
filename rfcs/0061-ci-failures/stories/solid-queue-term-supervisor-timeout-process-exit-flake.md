---
title: "solid-queue-term-supervisor-timeout-process-exit-flake"
status: in-progress
updated: 2026-11-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10783
claim: "2026-11-26T03:14:44Z"
assignee: "ci-ar-adapter-shards-dynamic-work-queue"
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/integration/async-processes-lifecycle.test.ts` ›
`AsyncProcessesLifecycleTest` › "term supervisor exceeding timeout while there are jobs in-flight"
failed on the MariaDB lane (Active Record MariaDB Tests (3)) of an unrelated PR, trails#10386
(run 44641107801, job 135972271350) with `Error: process.exit unexpectedly called with "1"` after
`Error: boom`. The file was added by trails#10375 (`AsyncProcessesLifecycleTest`, solid_queue v1.7.2,
`vendor/solid_queue/.../test/integration/async_processes_lifecycle_test.rb`). The supervisor's
timeout path reaches a real `exit(1)` instead of the stubbed/owned exit the test expects, likely
timing-dependent under a loaded runner.

## Acceptance criteria

- Root-cause why the timeout arm calls `process.exit` unstubbed in that test, and make the test
  deterministic (no real process exit from a vitest worker).
- The test passes reliably on all AR adapter lanes (rerun the MariaDB shard several times).
