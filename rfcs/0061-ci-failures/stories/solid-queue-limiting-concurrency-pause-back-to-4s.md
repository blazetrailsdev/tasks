---
title: "solid-queue: restore C's 4s pause in limiting-concurrency test"
status: ready
updated: 2026-11-27
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10810 raised job C's pause in `packages/solid-queue/test/integration/concurrency-controls.test.ts` ("run several jobs over the same record limiting concurrency") from 4s to 8s. Upstream uses `pause: 4.seconds` (`vendor/solid_queue/v1.7.2/test/integration/concurrency_controls_test.rb:84`). On a loaded MariaDB CI shard, jobs D–H did not drain within 4s: a SKIP LOCKED miss in `BlockedExecution.releaseOne` (`blocked_execution.rb:27-35`) falls back to the dispatcher's 1s maintenance tick. Measured locally, the margin at 4s was about 1.7s. The release path matches Rails.

## Acceptance criteria

- C's pause is back to 4s, as upstream has it.
- The test stays green on the MariaDB lane. The drain should get faster through the CI or test harness (for example, less fork contention on the shard), not through a change that moves the library away from Rails.
