---
title: "Flake: solid-queue DispatcherTest 'run more than one instance of the dispatcher' (14 vs 15)"
status: claimed
updated: 2026-11-19
rfc: "0061-ci-failures"
cluster: null
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-19T22:39:33Z"
assignee: "solid-queue-dispatcher-multiple-instances-flake"
blocked-by: null
closed-reason: null
---

## Context

Intermittent red in CI Active Record SQLite Tests (3) on trails#10350 (commit 8713c09350, run 44551523175), a PR that touches no solid-queue code:

`packages/solid-queue/test/dispatcher.test.ts:165` — `DispatcherTest > run more than one instance of the dispatcher`, failing `expected 14 to be 15` (the post-dispatch `ReadyExecution.count()`), with `ExclusiveConnectionTimeoutError` noise in the same log.

The test schedules 15 jobs at `wait: 0.2s`, starts two dispatchers (`pollingInterval: 0.1, batchSize: 10`) and waits up to 1s via `waitWhileWithTimeout(1, () => ScheduledExecution.isAny())`. Rails counterpart: `vendor/solid_queue/*/test/unit/dispatcher_test.rb` "run more than one instance of the dispatcher". Suspects: the two dispatchers racing on the same batch under SQLite with a lost/duplicated promotion (the `FOR UPDATE SKIP LOCKED` path has no SQLite equivalent), or `ScheduledExecution.isAny()` going false before the last `ReadyExecution` insert commits, or the 1s timeout under CI load with the pool exhausted.

## Acceptance criteria

- Determine whether a job is lost (a real dispatcher concurrency bug) or only counted early (a test-timing issue) under SQLite.
- Fix the root cause; if it is a dispatch bug, both dispatchers together must promote exactly 15 executions.
- No widened timeout as the sole fix; the test passes 50 consecutive local runs on SQLite.
