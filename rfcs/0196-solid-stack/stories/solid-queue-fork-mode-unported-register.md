---
title: "Register solid_queue v1.7.2's fork-only surface as unported (Node has no fork)"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: ["solid-queue-async-supervisor-v1-7-2"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Node has no `fork`, as RFC 0196's Decisions section records: the supervisor runs its processes as threads. `pnpm parity:api` / `parity:test --package solid-queue` (2026-11-16) still count v1.7.2's fork-only surface as missing:

- `fork_supervisor.rb`: 10 methods.
- The fork arms in `processes/runnable.rb`, `processes/poller.rb`, `processes/supervised.rb` and `scheduler.rb`: `create_fork`, `run_in_mode`'s fork arm, `alive?`, `boot_timed_out?`, `mark_as_reaped`.
- `SolidQueue.fork_boot_timeout` / `fork_boot_timeout=` and `LogSubscriber#fork_boot_timeout`.
- The tests `unit/fork_supervisor_test.rb` (8 skipped, 7 missing), `integration/forked_processes_lifecycle_test.rb` (3 skipped, 8 missing) and `integration/puma/plugin_fork_test.rb` (1).

## Acceptance criteria

- Each fork-only file, method and test is listed in the parity unported register (`scripts/parity/unported-files/` and the api-compare equivalent) with one reason that cites RFC 0196's fork-versus-threads decision.
- A member that also serves async mode (for example `alive?` if v1.7.2 uses it for threads) is not registered. It goes to `solid-queue-async-supervisor-v1-7-2` instead.
- After this story, `parity:api` and `parity:test` for solid-queue no longer count fork-only items as gaps.
