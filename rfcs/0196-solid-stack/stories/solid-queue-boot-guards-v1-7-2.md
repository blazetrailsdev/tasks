---
title: "solid-queue-boot-guards-v1-7-2"
status: draft
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

solid_queue v1.7.2 adds `SolidQueue::Processes::BootGuards` (`NullGuard`, `ForkGuard`) in
`vendor/solid_queue/v1.7.2/lib/solid_queue/processes/runnable.rb:109-180`, wired through
`Runnable#run_in_mode` / `#boot` / `#boot_timed_out?` / `#mark_as_reaped` (`runnable.rb:11-75`),
`SolidQueue.fork_boot_timeout` (`lib/solid_queue.rb:35`), `ForkSupervisor`'s
`fork_boot_timeout` instrumentation (`fork_supervisor.rb:45`) and
`LogSubscriber#fork_boot_timeout` (`log_subscriber.rb:179`). trails' `processes/runnable.ts`
still has the v1.1.3 `start` (no `run_in_mode`), and `fork_supervisor.rb` is unported, so
the guards have nowhere to attach. Split out of `solid-queue-configuration-checks-and-cli-v1-7-2`.

## Acceptance criteria

- `Runnable` gains `run_in_mode`, `boot_timed_out?`, `mark_as_reaped` and the boot guard
  completion at Rails names and shapes.
- `BootGuards::NullGuard` / `ForkGuard` are ported; `SolidQueue.forkBootTimeout` defaults to 5 minutes.
- `test/unit/boot_guards_test.rb` (4 tests) is ported at its test names; the fork-based
  arms follow root CLAUDE.md "Runtime facts Node does not expose" (`fork`) where they cannot run.
