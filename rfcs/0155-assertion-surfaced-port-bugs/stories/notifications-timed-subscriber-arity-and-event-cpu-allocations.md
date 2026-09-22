---
title: "notifications-timed-subscriber-arity-and-event-cpu-allocations"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced while converging `notifications_test.rb` assertions (RFC 0132,
`assertions-activesupport-logging-deprecation-callbacks-broadcast`). Four tests in
`packages/activesupport/src/notifications.test.ts` are parked `it.skip` with converged bodies.

1. `Event#cpu_time` / `#allocations` (`notifications_test.rb:41-49` "subscribe events",
   `:73-89` "subscribe via top level api"): Rails asserts `cpu_time > 0`,
   `allocations > 0` / `>= 100`. trails `Event#nowCpu` / `#nowAllocations`
   (`notifications/instrumenter.ts:106-116`) return hard-coded 0
   (Rails: `instrumenter.rb` `now_cpu` = `Process.clock_gettime(CLOCK_THREAD_CPUTIME_ID)`,
   `now_allocations` = `GC.stat :total_allocated_objects`).
2. `Notifications.subscribe(pattern, fn)` (`notifications.ts:49-57`) wraps every function in
   `(event) => callback(event)`, so a Rails timed subscriber
   `{ |name, started, finished, unique_id, data| }` never receives its positional args
   (`notifications_test.rb:110-126` "subscribe", `:135-160` "interleaved event"; started/finished
   arrive `undefined`). Rails picks Timed vs EventObject by callable arity in
   `Subscribers.new` (`fanout.rb`).

Not investigated beyond the above; cause of (2) read from `notifications.ts`, not verified against
alternatives.

## Acceptance criteria

- Remove the `it.skip` + `BLOCKED:` line from the four tests; they pass unchanged.
