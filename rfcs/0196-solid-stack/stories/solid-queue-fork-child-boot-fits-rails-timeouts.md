---
title: "solid-queue: fork child boots within Rails' test timeouts"
status: draft
updated: 2026-11-20
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Fork mode (trails#10407) boots each child from scratch: `packages/solid-queue/lib/processes/fork-entry.ts` imports the boot file through `test/support/fork-loader.mjs`, which type-strips the TS sources. Loading `lib/index.ts` alone takes ~1.4s, and a worker takes ~2.2–2.5s to register on a quiet host. Rails' timeouts assume a copy-on-write fork, e.g. `wait_for_registered_processes(2, timeout: 3.second)` (`vendor/solid_queue/v1.7.2/test/integration/fiber_processes_lifecycle_test.rb:14`). trails#10407 and trails#10427 widened those waits to 3–10s in `fiber-processes-lifecycle.test.ts:117`, `async-supervisor.test.ts` and the fork-supervisor tests.

## Acceptance criteria

- The fork child's boot fits Rails' timeouts, for example by booting from built `dist` rather than type-stripped sources.
- Every widened `waitForRegisteredProcesses` / `waitFor` timeout returns to its Rails v1.7.2 value.
