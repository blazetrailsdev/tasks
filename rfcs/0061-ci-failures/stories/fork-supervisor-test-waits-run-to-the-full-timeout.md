---
title: "solid-queue: fork-supervisor test waits run to the full 10s where the supervisor never registers"
status: draft
updated: 2026-11-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/fork-supervisor.test.ts` takes ~114s in CI (one fork for the whole file), and ~45s of that is waiting for processes that never register.

Upstream waits with the 1 second default everywhere in this file: `wait_for_registered_processes(count, timeout: 1.second)` (`vendor/solid_queue/v1.7.2/test/test_helpers/processes_test_helper.rb:20-22`), called as `wait_for_registered_processes(4)` from `run_supervisor_as_fork_with_captured_io` (`:10-18`) and from "abort if there's already a pidfile for a supervisor" and "delete previous pidfile if the owner is dead" (`vendor/solid_queue/v1.7.2/test/unit/fork_supervisor_test.rb:98-130`).

The port passes `{ timeout: 10 }` at those sites (`packages/solid-queue/test/support/processes-test-helper.ts`, `runSupervisorAsForkWithCapturedIo`; `fork-supervisor.test.ts` in the two tests above), because a Node supervisor takes longer than 1s to boot and register. In three places the supervisor is expected to exit without registering anything (the pidfile is already held, or its owner was killed), so the wait always runs the full 10s:

- `runSupervisorAsForkWithCapturedIo`'s `waitForRegisteredProcesses(4, { timeout: 10 })` when the forked supervisor aborts on an existing pidfile.
- "abort if there's already a pidfile for a supervisor": the second `waitForRegisteredProcesses(4, { timeout: 10 })`.
- "delete previous pidfile if the owner is dead": `waitForRegisteredProcesses(0, { timeout: 10 })` after the KILL, where upstream's 1s is enough because nothing deregisters.

Measured on trails#10765's first experiment run: with those three waits cut short the file took 68-73s on the SQLite, PostgreSQL and MariaDB lanes, against 114s before. The experiment did it with an invented `whileAlive` option on `waitForRegisteredProcesses`, which upstream does not have, so it was dropped from that PR.

## Acceptance criteria

- The three waits above no longer run to a 10s timeout when the supervisor has already exited.
- `waitForRegisteredProcesses` keeps upstream's signature (`count`, `timeout:`); no option upstream lacks is added. Where upstream's 1s default is enough (the `0` wait after the KILL), the call is upstream's bare call.
- Any timeout that stays above upstream's 1s is the smallest that passes on all three adapter lanes.
- `fork-supervisor.test.ts` passes on SQLite, PostgreSQL and MariaDB, with test names unchanged.
