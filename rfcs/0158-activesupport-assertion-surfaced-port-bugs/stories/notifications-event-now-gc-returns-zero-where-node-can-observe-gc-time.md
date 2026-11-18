---
title: "activesupport: Notifications::Event#now_gc returns 0 where Node can observe GC time"
status: blocked
updated: 2026-11-18
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-11-18T20:06:38Z"
assignee: "date-and-time-calculations-drops-eager-date-time-imports"
blocked-by: "operator decision: no synchronous cumulative GC-time source on Node. Tried perf_hooks' global PerformanceObserver({entryTypes:['gc']}) with takeRecords() at each read: after 3e6 allocations in one sync turn takeRecords() returns 0 entries; the 253 gc entries (28.9ms) are delivered only after the event loop turns. So a nowGc read at start!/finish! of a synchronous block always differs by 0, and an async block sees a lagged total. Proposed: add nowGc beside nowAllocations in CLAUDE.md 'Runtime facts Node does not expose' (answers 0, the arm Rails takes without GC.total_time, instrumenter.rb:219-227)."
closed-reason: null
---

## Context

Surfaced in review of trails#8685. `ActiveSupport::Notifications::Event#now_gc`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/notifications/instrumenter.rb:219-227`)
is defined as `GC.total_time` where `GC.respond_to?(:total_time)`, and as `0`
otherwise. trails' `nowGc`
(`packages/activesupport/src/notifications/instrumenter.ts:110-112`) returns 0
unconditionally, so `Event#gc_time` is always 0.

Its sibling `nowAllocations` is ratified as permanent (trails CLAUDE.md §
"Runtime facts Node does not expose"): JS has no monotonic allocated-object
counter. `nowGc` was deliberately left out of that section, because Node can
observe GC durations: `perf_hooks`' `PerformanceObserver` reports `gc` entries
with a duration. Whether a cumulative total can be read synchronously at
`start!` / `finish!` from that source has not been tried.

## Acceptance criteria

- `nowGc` returns a cumulative GC time in the unit Rails' `gc_time` expects
  (`instrumenter.rb`, `gc_time` converts from nanoseconds), read synchronously,
  on Node; other runtimes keep the 0 definition.
- A Rails test asserting on `gc_time` that is parked on this is unskipped, or
  the PR says none is.
- If no synchronous cumulative source exists, the story is blocked with what
  was tried, and the limit is proposed for CLAUDE.md § "Runtime facts Node does
  not expose"; it is not closed on a guess.
