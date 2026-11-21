---
title: "Port the fork supervisor and forked-lifecycle tests against real child processes"
status: done
updated: 2026-11-21
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: ["solid-queue-fork-mode-unported-register"]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#10448
claim: "2026-11-20T21:11:33Z"
assignee: "solid-queue-fork-supervisor-tests-v1-7-2"
blocked-by: null
closed-reason: null
---

## Context

Once `solid-queue-fork-mode-unported-register` ports `ForkSupervisor` on `child_process.fork` (RFC README, "Decisions", 2026-11-18), the fork test files can run against real child processes. `pnpm parity:test --package solid-queue` (2026-11-18) reports:

- `vendor/solid_queue/v1.7.2/test/unit/fork_supervisor_test.rb`: 15 tests (8 misplaced, 7 missing), e.g. "replace a terminated fork even if releasing its claimed jobs fails" (`:132`), "replace only the fork that does not finish booting" (`:276`), "preserve a fork that finishes booting before the timeout" (`:291`).
- `vendor/solid_queue/v1.7.2/test/integration/forked_processes_lifecycle_test.rb`: 11 tests (3 misplaced, 8 missing).
- `vendor/solid_queue/v1.7.2/test/integration/puma/plugin_fork_test.rb`: 1 test.

`solid-queue-retire-fork-emulating-supervisor-tests` moves the 11 misplaced tests to these files as `it.skip` pointing here.

## Acceptance criteria

- All 27 tests are ported at their v1.7.2 names and bodies and run against real `child_process.fork` children, with the parked `it.skip`s un-skipped.
- A test that asserts on heap state copied into the fork is parked under `PERMANENT-SKIP:` citing CLAUDE.md, "Runtime facts Node does not expose", with the reason naming the copied state. Every other test runs.
- Spawned children are always reaped in teardown. A failing test leaves no orphan process, and the suite runs within the Unit Tests job's timeout.
- `parity:test --package solid-queue` shows these three files with no missing or misplaced rows.
