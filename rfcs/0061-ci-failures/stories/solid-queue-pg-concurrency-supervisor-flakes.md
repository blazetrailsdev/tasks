---
title: "solid-queue-pg-concurrency-supervisor-flakes"
status: claimed
updated: 2026-11-27
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-27T04:14:44Z"
assignee: "ci-ar-adapter-shards-dynamic-work-queue"
blocked-by: null
closed-reason: null
---

## Context

solid-queue process/concurrency integration tests fail intermittently on the
Active Record PostgreSQL Tests (3) lane, on PRs whose diff does not touch
solid-queue (seen twice on trails#10421, a stimulus test move):

- run 44777466110 / job 136431159159 (2026-11-20):
  `packages/solid-queue/test/integration/concurrency-controls.test.ts`
  > ConcurrencyControlsTest > don't block claimed executions that get released
  > (`AssertionError: expected false to be truthy`, 3449ms)
- run 44793433144 / job 136487351721 (2026-11-20):
  - `packages/solid-queue/test/supervisor.trails.test.ts` > ForkSupervisorTest >
    replaces a forked worker killed with KILL and fails the jobs it had claimed
  - concurrency-controls.test.ts > ConcurrencyControlsTest > run several jobs
    over the same record limiting concurrency
  - concurrency-controls.test.ts > ConcurrencyControlsTest > discard jobs when
    concurrency limit is reached with on_conflict: :discard

`solid-queue-concurrency-controls-pg-timeouts` (trails#10005) addressed PG
timeouts in the same file earlier; this is a recurrence or a different race.

## Acceptance criteria

- Root-cause the PG-lane intermittency (timing waits, worker/supervisor
  shutdown, or shared DB state across tests) for the four tests above.
- Fix the cause; no `it.skip`, retry wrapper, or widened timeout without a
  measured reason.
- The four tests pass on repeated PG runs (e.g. 20x locally against the
  compose stack).
