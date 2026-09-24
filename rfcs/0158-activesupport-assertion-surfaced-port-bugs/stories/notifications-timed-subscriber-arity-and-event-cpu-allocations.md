---
title: "notifications-timed-subscriber-arity-and-event-cpu-allocations"
status: claimed
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-24T22:44:14Z"
assignee: "deprecation-silence-and-allow-restore-before-an-async-block-settles"
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
