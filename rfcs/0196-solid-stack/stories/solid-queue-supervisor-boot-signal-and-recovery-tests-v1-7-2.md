---
title: "solid-queue-supervisor-boot-signal-and-recovery-tests-v1-7-2"
status: in-progress
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10388
claim: "2026-11-19T23:19:12Z"
assignee: "solid-queue-batch-test-membership-and-pending-migrations"
blocked-by: null
closed-reason: null
---

## Context

The AsyncSupervisor / ForkSupervisor split landed with `test/async-supervisor.test.ts` (from `vendor/solid_queue/v1.7.2/test/unit/async_supervisor_test.rb`). Three supervisor test files from the same story are still unported:

- `vendor/solid_queue/v1.7.2/test/integration/supervisor_boot_signal_test.rb` (1 test, "TERM during supervisor start hooks exits without starting workers"). `Supervisor#start_processes` (`lib/solid_queue/supervisor.rb:71-80`) already breaks on `time_to_stop?`; in trails the test drives `runSupervisor` and `signalProcess` from `test/support/processes-test-helper.ts` in place of `Process.kill(:TERM, pid)`.
- `vendor/solid_queue/v1.7.2/test/unit/process_recovery_test.rb` (2 tests). Both run the fork supervisor (`Supervisor(fork)`, a `KILL` of the worker pid), which trails emulates with threads in `packages/solid-queue/lib/fork-supervisor.ts` (`waitpid2`).
- `vendor/solid_queue/v1.7.2/test/unit/supervised_test.rb` (1 test) needs `Supervised#create_fork`. It belongs to `solid-queue-fork-mode-unported-register`, so port it there, not here.

## Acceptance criteria

- `supervisor-boot-signal.test.ts` and `process-recovery.test.ts` exist with Rails' test names and pass on SQLite, PostgreSQL and MariaDB.
- A test that needs real forking is parked as `it.skip` under `// BLOCKED: solid-queue-fork-mode-unported-register`.
