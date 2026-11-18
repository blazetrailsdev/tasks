---
title: "Move the fork-emulating supervisor tests to their Rails files ahead of the async split"
status: ready
updated: 2026-11-18
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`solid-queue-async-supervisor-v1-7-2` replaces trails' `Supervisor` (`packages/solid-queue/lib/supervisor.ts`) with v1.7.2's base `Supervisor` + `AsyncSupervisor` (`vendor/solid_queue/v1.7.2/lib/solid_queue/supervisor.rb`, `async_supervisor.rb`). Today `Supervisor` emulates `ForkSupervisor` with threads (`forks`, `waitpid2`, `reapTerminatedForks`, `replaceFork`). Eleven tests depend on that emulation, and `parity:test` reports all eleven as misplaced:

- `test/supervisor.trails.test.ts`, 8 tests, belongs in `fork-supervisor.test.ts` (`test/unit/fork_supervisor_test.rb`).
- `test/integration/processes-lifecycle.test.ts`, 3 tests, belongs in `integration/forked-processes-lifecycle.test.ts` (`forked_processes_lifecycle_test.rb`).
- `test/support/processes-test-helper.ts`'s `signalProcess` reads `supervisor.forks[name]` and `_thread.kill()`.

The operator decided on 2026-11-18 that fork mode is ported on `child_process.fork` (RFC README, "Decisions"), so these tests are re-ported against the real `ForkSupervisor` by `solid-queue-fork-supervisor-tests-v1-7-2`, not parked.

## Acceptance criteria

- The eleven tests move to their Rails files under their Rails names, parked as `it.skip` with a `CONVERGEABLE solid-queue-fork-supervisor-tests-v1-7-2` line, so `parity:test` shows 0 misplaced for solid-queue.
- `runSupervisor` / `signalProcess` work against `processInstances` and real pids, so the AsyncSupervisor split can land without reddening the lifecycle suites.
