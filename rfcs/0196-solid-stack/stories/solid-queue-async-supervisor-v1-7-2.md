---
title: "Port v1.7.2's AsyncSupervisor split and process-layer members"
status: ready
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps:
  - solid-queue-v1-7-2-remaining-drift
  - solid-queue-retire-fork-emulating-supervisor-tests
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

v1.7.2 splits `Supervisor` into `AsyncSupervisor` and `ForkSupervisor` and adds `mode` / `standalone?`. RFC 0196's Decisions section already runs supervisees as threads, which is upstream's async mode. `pnpm parity:api --package solid-queue` on 2026-11-16 lists these as missing:

- `async_supervisor.rb`: all 8 methods, no TS file.
- `supervisor.rb`: 11 members, including `mode`, `standalone?`, `process_instances`, `check_and_replace_terminated_processes`, `perform_graceful_termination` and `run_exit_hooks`.
- `supervisor/maintenance.rb`: `release_claimed_jobs_by`, `attempt_to_release_claimed_jobs_by`.
- `processes/runnable.rb` (13), `processes/poller.rb`, `processes/interruptible.rb` (`self_pipe`, `create_self_pipe`) and `processes/thread_terminated_error.rb`.
- `create_thread` in `app_executor.rb`, `pool.rb`, `processes/base.rb` and `scheduler/recurring_schedule.rb`.

The tests `unit/async_supervisor_test.rb` (8), `integration/supervisor_boot_signal_test.rb` (1), `unit/supervised_test.rb` (1) and `unit/process_recovery_test.rb` (2) are unported.

## Acceptance criteria

- `SolidQueue::AsyncSupervisor` exists at Rails' name and replaces trails' thread-mode `Supervisor` internals. `Supervisor` keeps only what v1.7.2's base class keeps.
- The listed process, runnable and `create_thread` members are ported. Only the fork-only arms (`create_fork`, `boot_timed_out?` on forks) are left to `solid-queue-fork-mode-unported-register`.
- The four test files pass on the three canonical adapters. `solid-queue-async-processes-lifecycle-test-v1-7-2` stays green.
