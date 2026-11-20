---
title: "Port ForkSupervisor and the fork arms of Runnable on child_process.fork"
status: in-progress
updated: 2026-11-20
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps:
  - solid-queue-async-supervisor-v1-7-2
  - solid-queue-boot-guards-v1-7-2
deps-rfc: []
est-loc: 500
priority: null
pr: trails#10407
claim: "2026-11-20T03:12:38Z"
assignee: "solid-queue-fork-mode-unported-register"
blocked-by: null
closed-reason: null
---

## Context

The RFC's fork decision was reversed on 2026-11-18 (README, "Decisions"): fork mode is ported on `child_process.fork` rather than registered as unported. A single-event-loop async mode lets one CPU-bound job stall heartbeats, polling and dispatch for every supervisee, so trails needs a multiprocess mode, and `fork` stays the default `mode` as in `Configuration#default_options`.

`pnpm parity:api --package solid-queue` (2026-11-18) counts as missing:

- `fork_supervisor.rb` (`vendor/solid_queue/v1.7.2/lib/solid_queue/fork_supervisor.rb:1-87`): `perform_graceful_termination`, `perform_immediate_termination`, `term_forks`, `quit_forks`, `check_and_replace_terminated_processes`, `check_boot_timeouts`, `terminate_unready_process`, `reap_terminated_forks`, `replace_fork`, `all_processes_terminated?`.
- `create_fork` in `processes/supervised.rb:28-40`, and the fork arm of `run_in_mode` in `processes/runnable.rb:49-62`, as inherited by `poller.rb` and `scheduler.rb`.
- `processes/runnable.rb`'s `alive?`, `boot_timed_out?`, `mark_as_reaped` (`:30-42`) where `solid-queue-boot-guards-v1-7-2` has not already landed them.

## Shape

- `create_fork(&block)`'s `fork do ... end` is `child_process.fork(entry, ...)`. The entry module boots the app and runs the supervisee's `register_signal_handlers` / `block.call` / exit sequence. The child has a fresh heap, not a copy of the parent's, so it is told which supervisee to build over the IPC channel (the serialized `Configuration::Process`). That re-boot is the one deviation, and it is receipted at the `create_fork` call site citing the README decision.
- `::Process.waitpid2(-1, ::Process::WNOHANG)` reads a queue that the children's `exit` events fill (pid plus a `Process::Status`-shaped status), so `reap_terminated_forks` and `check_and_replace_terminated_processes` keep their loop bodies.
- `::Process.kill(signal, pid)` in `term_forks` / `quit_forks` is `process.kill(pid, signal)`.
- `ForkGuard`'s pipe (`runnable.rb:132-180`) is a pipe passed through `stdio`, or the IPC channel, with `complete` running in the child and `start` in the parent as in Ruby.
- ruby-compat gains `Process.kill` / `waitpid2` / `Process::Status` only to the extent these call sites need, each at its MRI name with an MRI citation.

## Acceptance criteria

- `fork_supervisor.rb`, `create_fork` and the fork arm of `run_in_mode` are ported at their Rails names and in their Rails order, and `parity:api --package solid-queue` reports `fork_supervisor.rb` at 100%.
- A supervisor started with `mode: :fork` runs each configured worker, dispatcher and scheduler in its own OS process with its own `Process.pid`, registered in `solid_queue_processes`.
- TERM, then QUIT after `shutdown_timeout`, stops every child; a child killed with KILL is reaped, its claimed jobs are released with `ProcessExitError`, and it is replaced.
- No new `@noRailsEquivalent` other than the receipted `create_fork` re-boot.
