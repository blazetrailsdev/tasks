---
title: "activesupport: Notifications::Event#now_gc returns 0 where Node can observe GC time"
status: draft
updated: 2026-10-08
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
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
