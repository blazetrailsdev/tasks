---
title: "ThreadPoolExecutor runs tasks in post order; port solid_cable's does-not-send-old-messages"
status: draft
updated: 2026-11-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "solid-cable"]
deps: []
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

`ThreadPoolExecutor#post` (`packages/ruby-compat/lib/thread-pool-executor.ts:95-117`) hands a task to an
idle worker through `this._ready.pop()!(task)`, which resolves that worker's `_nextTask()` promise. The
worker only runs the task after its `await` resumes. A task posted next, when no worker is idle, goes to
`_runWorker`, whose `new Thread(...)` body runs it before that first `await` resumes. So two tasks posted
back to back can run in reverse order.

Action Cable's `StreamEventLoop#post` (`packages/actioncable/lib/connection/stream-event-loop.ts:40-45`)
delivers every subscriber callback through this pool. solid_cable v3.0.12's
"does not send old messages" (`vendor/solid_cable/v3.0.12/test/lib/action_cable/subscription_adapter/solid_cable_test.rb:151-176`)
broadcasts `channel3` then `channel4` and pops them in order. The ported test received `channel4` first,
so it was left out of the solid_cable bump PR. `Listener#broadcast_messages` itself is converged.

## Acceptance criteria

- [ ] Tasks posted to a `ThreadPoolExecutor` start in post order, as concurrent-ruby's
      `RubyThreadPoolExecutor#ns_execute` / `ns_assign_worker` gives them under MRI. A
      `ruby-compat` test fails on the current pool and passes after the fix.
- [ ] solid_cable's "does not send old messages" is ported into
      `packages/solid-cable/test/action-cable/subscription-adapter/solid-cable.test.ts` and passes.
