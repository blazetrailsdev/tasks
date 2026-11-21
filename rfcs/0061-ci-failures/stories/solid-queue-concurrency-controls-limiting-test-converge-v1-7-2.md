---
title: "solid-queue-concurrency-controls-limiting-test-converge-v1-7-2"
status: draft
updated: 2026-11-21
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

`ConcurrencyControlsTest > run several jobs over the same record limiting concurrency` (`packages/solid-queue/test/integration/concurrency-controls.test.ts:152`) failed on trails#10448, run 44840675984, in `Active Record SQLite Tests (1)`:

```text
AssertionError: expected [ 'seq: sCcC' ] to include 'seq: sBcBsEcEsGcGsHcH'
```

The test passes locally (3/3), and recent main runs are green.

The TS body follows an older upstream version, not v1.7.2:

- A, B and C pause `0.5 + incr` seconds (0.5s, 1s, 1.5s).
- It then sleeps `0.01` before enqueuing D–H, each with `pause: 0.05`.

v1.7.2 (`vendor/solid_queue/v1.7.2/test/integration/concurrency_controls_test.rb`, the test of the same name) is different:

- A and B pause 1.5s and C pauses 4s.
- It waits `wait_for(timeout: 2.seconds) { SolidQueue::ClaimedExecution.count >= 3 }` before enqueuing D–H.
- D–H pause 0.01s.
- It ends with `wait_for_jobs_to_finish_for(15.seconds)` and `assert_no_unfinished_jobs`.
- Its comment explains why: "A and B must pause long enough to still hold their semaphore slots while D–H are being enqueued, even on a slow CI runner — otherwise some of D–H claim a freed slot instead of blocking."

On a loaded runner, the short pauses let D–H claim freed slots, which is the failure seen.

## Acceptance criteria

- The test body matches v1.7.2: the pauses, the `wait_for` on `ClaimedExecution.count >= 3`, the 15s finish wait, `assert_no_unfinished_jobs`, and the final assertion.
- The test passes repeatedly locally, and on CI under the SQLite, PostgreSQL and MariaDB lanes.
