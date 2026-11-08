---
title: "Finish solid-queue processes_lifecycle tests and settle the puma plugin"
status: ready
updated: 2026-11-08
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`integration/processes-lifecycle.test.ts` exists but ports 1 of 11 tests on origin/main. The 10 missing tests are kill/term/quit/int supervisor with jobs in flight, term multiple times, term past the timeout, jobs that raise, a job that exits, and terminate/kill worker individually. `integration/puma/plugin_test.rb` (3) is unported, and so is `vendor/solid_queue/v1.1.3/lib/puma/plugin/solid_queue.rb`. trails has no puma package.

The supervisor runs supervisees as threads, not forks (RFC decision, `Supervisor#signal_process`). So the signal tests map onto `signal_process` semantics.

## Acceptance criteria

- The 10 processes_lifecycle tests are ported under their Rails names and pass, using the thread-supervisor signal path.
- The puma plugin tests are either ported against trails' server integration, or the file and its tests go in the unported register with a reason (no puma in trails). They are not silently dropped.
- `pnpm parity:test --package solid-queue` reaches 100% once this and the sibling test stories land.
