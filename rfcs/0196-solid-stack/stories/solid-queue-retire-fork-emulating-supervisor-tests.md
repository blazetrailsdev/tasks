---
title: "solid-queue-retire-fork-emulating-supervisor-tests"
status: ready
updated: 2026-11-18
rfc: "0196-solid-stack"
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

`solid-queue-async-supervisor-v1-7-2` replaces trails' `Supervisor` (`packages/solid-queue/lib/supervisor.ts`) with v1.7.2's base `Supervisor` + `AsyncSupervisor` (`vendor/solid_queue/v1.7.2/lib/solid_queue/supervisor.rb`, `async_supervisor.rb`). Today `Supervisor` emulates `ForkSupervisor` with threads (`forks`, `waitpid2`, `reapTerminatedForks`, `replaceFork`), and `test/integration/processes-lifecycle.test.ts` (a port of the fork-only `forked_processes_lifecycle_test.rb`) plus `test/support/processes-test-helper.ts`'s `signalProcess` (`supervisor.forks[name]`, `_thread.kill()`, per-supervisee TERM/QUIT) and `test/supervisor.trails.test.ts` depend on that emulation. `Configuration#default_options` defaults `mode` to `fork`.

## Acceptance criteria

- Decide (operator) what happens to the fork-emulating tests: park as `PERMANENT-SKIP` under `solid-queue-fork-mode-unported-register`, or re-port against `async_processes_lifecycle_test.rb`.
- `runSupervisor` / `signalProcess` work against `processInstances` so the AsyncSupervisor split can land without reddening the lifecycle suites.
