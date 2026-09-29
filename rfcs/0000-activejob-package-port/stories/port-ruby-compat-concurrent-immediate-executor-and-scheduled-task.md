---
title: "Port Concurrent::ImmediateExecutor and Concurrent::ScheduledTask to ruby-compat"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AsyncAdapter::Scheduler` uses three concurrent-ruby classes
(`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters/async_adapter.rb:86-103`). ruby-compat has
`ThreadPoolExecutor` (`packages/ruby-compat/src/thread-pool-executor.ts:14`),
whose tasks each run in a ruby-compat `Thread` (`:53`, so each gets its own
execution context). It does not have the other two:

- `Concurrent::ImmediateExecutor.new` (`:88`): `post` runs the task inline.
- `Concurrent::ScheduledTask.execute(delay, args:, executor:, &task)` (`:99`):
  after `delay` seconds, posts `task.(*args)` to `executor`.

Add both beside `ThreadPoolExecutor`, each with the package's
`@noRailsEquivalent PERMANENT` inventory receipt. `ScheduledTask` is a
`setTimeout` that posts to the given executor, `unref`'d so a pending job does
not hold the process open; `ThreadPoolExecutor#shutdown` clears timers it
scheduled (RFC Open question 1).

## Fidelity traps (predicted at authoring)

- [ ] `ImmediateExecutor#post` returns only after an async task settles when the caller awaits it; an `immediate = true` async adapter must finish the job before `perform_later` resolves (`async_adapter_test.rb` asserts `JobBuffer.last_value` right after `perform_later`).

## Acceptance criteria

- [ ] Both classes exist with receipts and tests; `pnpm parity:api:extra:gate` is green.
- [ ] A `ScheduledTask` with `delay` 0.05 posts after the delay, and one cancelled by `shutdown` never runs.

## Definition of done

Inlining either into `async-adapter.ts` does not close this story.
