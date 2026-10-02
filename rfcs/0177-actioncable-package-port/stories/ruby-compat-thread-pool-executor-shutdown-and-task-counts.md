---
title: "ruby-compat ThreadPoolExecutor: shutdown, shuttingdown?, <<, name: and task counts"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Action Cable builds two `Concurrent::ThreadPoolExecutor`s and calls more of
the class than ruby-compat has.

`packages/ruby-compat/src/thread-pool-executor.ts:14` has a constructor that
requires `minThreads`, `maxThreads`, `maxQueue` and `fallbackPolicy:
"caller_runs"` (`:22-38`), and `post` (`:41`). It was written for
ActiveRecord's async-query pool
(`0130/async-executor-onto-a-thread-pool-executor-port`, done).

Action Cable calls:

- `Concurrent::ThreadPoolExecutor.new(name: "ActionCable", min_threads: 1,
max_threads: max_size, max_queue: 0)` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/worker.rb:22-27`) and
  `.new(min_threads: 1, max_threads: 10, max_queue: 0)`
  (`connection/stream_event_loop.rb:70-74`). Neither passes `fallback_policy`
  (concurrent-ruby's default is `:abort`), and one passes `name:`.
- `@executor.shutdown` (`worker.rb:33`) and `@executor.shuttingdown?`
  (`worker.rb:37`), which `Engine`'s work hook reads to skip work on a
  halted pool (`engine.rb:80`).
- `@executor << task` (`stream_event_loop.rb:27`).
- In tests: `executor.completed_task_count` / `scheduled_task_count`
  (`vendor/rails/v8.0.2/actioncable/test/test_helper.rb:33`) and `Concurrent.global_io_executor`
  (`test_helper.rb:22`, `stubs/test_server.rb:35`).

concurrent-ruby is not vendored. Like the existing class, each addition carries
the package's `@noRailsEquivalent PERMANENT` inventory receipt and a README row
naming its Action Cable call site (ruby-compat rule 1).

Adjacent, not overlapping:
`0169/port-ruby-compat-concurrent-immediate-executor-and-scheduled-task`
(draft) adds `ImmediateExecutor` and `ScheduledTask` beside this class, and
its text says `ThreadPoolExecutor#shutdown` clears the timers it scheduled.
Whichever of the two lands second builds on the other's `shutdown`.

## Fidelity traps (predicted at authoring)

- [ ] **`shutdown` is graceful.** Tasks already posted still run; a task posted afterwards is rejected under the fallback policy. `shuttingdown?` is true from the call until the queue drains, then `shutdown?` is.
- [ ] **`fallback_policy` defaults to `:abort`.** Making the argument optional must not change ActiveRecord's `caller_runs` pool.
- [ ] **`max_queue: 0` is unbounded**, which the existing class already implements (`:44`). With it, the abort arm is reachable only after `shutdown`.
- [ ] **Task counts.** `scheduled_task_count` counts every accepted `post`; `completed_task_count` counts settled tasks, including ones that raised. `wait_for_executor` polls for equality, so a count that misses rejected promises hangs the test helper.
- [ ] **`global_io_executor` is one shared pool.** Rails' test stub swaps it into the event loop so `wait_for_async` can watch it. It must be the same object on every read.

## Acceptance criteria

- [ ] `ThreadPoolExecutor` accepts `name:` and an optional `fallbackPolicy`, and has `shutdown`, `isShuttingdown`, a `<<` spelling per `docs/ruby-ts-conventions.md`, `completedTaskCount` and `scheduledTaskCount`.
- [ ] `Concurrent.global_io_executor` has a ruby-compat counterpart.
- [ ] Each new member has a `@noRailsEquivalent PERMANENT` receipt and a README row; `pnpm parity:api:extra:gate` is green.
- [ ] ActiveRecord's async-query tests still pass.

## Definition of done

A second executor class written inside `packages/actioncable` does not close this story.

## Verification

```bash
pnpm vitest run packages/ruby-compat/src/thread-pool-executor.trails.test.ts
pnpm vitest run packages/activerecord/src -t 'async'   # the existing pool's consumers
pnpm parity:api:extra:gate
```
