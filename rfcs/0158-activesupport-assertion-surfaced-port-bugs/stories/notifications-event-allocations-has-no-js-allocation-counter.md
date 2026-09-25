---
title: "notifications-event-allocations-has-no-js-allocation-counter"
status: blocked
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Per the story's own AC fallback: JS exposes no monotonic allocated-object counter (v8.getHeapStatistics / process.memoryUsage report heap occupancy, which GC lowers). GC.stat(:total_allocated_objects) cannot be backed honestly, so Event#nowAllocations (notifications/instrumenter.ts:114) stays Rails' JRuby/TruffleRuby 0 arm and the 2 parked notifications.test.ts tests stay skipped. Language/runtime shortcoming."
closed-reason: null
---

## Context

Split out of `notifications-timed-subscriber-arity-and-event-cpu-allocations`,
which converged the timed-subscriber arity dispatch and `Event#now_cpu`.

Two tests in `packages/activesupport/src/notifications.test.ts` stay parked
`it.skip` with converged bodies, because they assert allocation counts:

- `subscribe events` (`vendor/rails/activesupport/test/notifications_test.rb:41-49`):
  `assert_operator event.allocations, :>, 0`.
- `subscribe via top level api` (`notifications_test.rb:73-89`):
  `assert_operator event.allocations, :>=, 100`.

Rails' `Event#now_allocations`
(`vendor/rails/activesupport/lib/active_support/notifications/instrumenter.rb:229-237`)
reads `GC.stat(:total_allocated_objects)` on MRI and answers `0` "on JRuby,
TruffleRuby". trails' `Event#nowAllocations`
(`packages/activesupport/src/notifications/instrumenter.ts`) is that `0` arm.

JS exposes no cumulative allocation counter: Node 24's
`v8.getHeapStatistics()` and `process.memoryUsage()` report heap _occupancy_
(`used_heap_size` / `heapUsed`), which a GC lowers, not a monotonic count of
allocated objects. A heap-occupancy delta would measure bytes, not objects,
and go negative across a collection.

`nowGc` (`GC.total_time`, `instrumenter.rb:219-227`) has the same shape and
is also `0`.

## Acceptance criteria

- [ ] Decide whether a JS runtime counter can honestly back
      `GC.stat(:total_allocated_objects)` (e.g. a ruby-compat `GC.stat`
      over a host adapter). If one can, port `now_allocations` onto it and
      un-skip both tests with their bodies unchanged.
- [ ] If none can, `tasks block` this story with that finding rather than
      approximating allocations with heap occupancy.
