---
title: "solid-queue-fork-supervisor-boot-fits-rails-timeouts"
status: draft
updated: 2026-11-21
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

trails#(this PR) boots fork children from a Vite/Rollup bundle built by `packages/solid-queue/test/support/fork-bundle-global-setup.ts`, which cuts a child's module load from ~1.5s to ~0.65s, and restores most widened waits to their Rails v1.7.2 values. Some cannot fit: a forked supervisor must boot and then fork children that boot in turn, so two generations of ~0.65s plus registration miss Rails' 1–2s waits.

- `fork-supervisor.test.ts` "start": `wait_for_registered_processes(4)`, default 1s (`vendor/solid_queue/v1.7.2/test/unit/fork_supervisor_test.rb:40`; `processes_test_helper.rb:20`). It stays at 10s.
- "start with provided configuration": `timeout: 2` (`fork_supervisor_test.rb:54`). It stays at 10s.
- "replace only the fork that does not finish booting" / "preserve a fork that finishes booting before the timeout": `fork_boot_timeout = 0.2.seconds` / `0.5.seconds` and `timeout: 2.seconds` (`fork_supervisor_test.rb:276-300`). They stay at 10s / 20s.
- "delete previous pidfile if the owner is dead": two `wait_for_registered_processes(4)` waits at the 1s default (`fork_supervisor_test.rb:114,124`). They stay at 10s, because the second supervisor's pidfile is not yet written after 1s on CI's PostgreSQL and MariaDB lanes (trails#10484).

## Acceptance criteria

- A fork child is ready within Rails' budget, for example through a V8 startup snapshot or a pre-warmed child, and the waits above return to their v1.7.2 values.
