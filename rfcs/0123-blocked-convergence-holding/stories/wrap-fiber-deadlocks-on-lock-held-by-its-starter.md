---
title: "activesupport: wrap's Fiber deadlocks on a ThreadLoadInterlockAwareMonitor held by the Fiber that started it"
status: blocked
updated: 2026-11-04
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-11-04T20:11:23Z"
assignee: "activestorage-tests-run-inside-executor"
blocked-by: "owner decision: packages/activesupport/CLAUDE.md 'A thread-owned lock is owned by the Fiber' (2026-11-04, trails#9706) says a Fiber nested under the owner waits and not to converge back to Thread; this story asks the nested wrap Fiber to re-enter"
closed-reason: null
---

## Context

trails#9706 made `ExecutionWrapper.wrap` (`packages/activesupport/src/execution-wrapper.ts`) run each non-nested execution on its own `Fiber`. By repo-owner ruling, it also made `ThreadLoadInterlockAwareMonitor`'s owner `Fiber.current` (`packages/activesupport/src/concurrency/load-interlock-aware-monitor.ts`; ruling in `packages/activesupport/CLAUDE.md`, "A thread-owned lock is owned by the Fiber"). Rails reads `Thread.current` there (`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb:46-63`), so in Ruby, code holding the adapter lock on a Thread re-enters it from any Fiber of that Thread.

Under the new owner, a flow that holds a `ThreadLoadInterlockAwareMonitor` on the root Fiber and then awaits `executor.wrap(...)`, whose block takes the same lock, deadlocks: the wrap's Fiber waits on a holder that is waiting on the wrap. No test in the suite reaches this today.

## Acceptance criteria

- A trails test reproduces the case: the adapter lock is held on the root Fiber, and `wrap` runs a block that takes it.
- A wrap's Fiber re-enters a lock held by the Fiber that started the wrap, as Ruby's Thread owner would, and two concurrent wrap Fibers still exclude each other. Converge toward `Thread.current` semantics (owner = the wrap's originating flow chain), not away from it.
