---
title: "move-remaining-monotonic-seats-onto-process-clock-gettime"
status: in-progress
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 27
pr: 7492
claim: "2026-09-04T19:44:33Z"
assignee: "move-remaining-monotonic-seats-onto-process-clock-gettime"
blocked-by: null
closed-reason: null
---

## Context

`port-io-and-process-classes-and-unexempt` (#7438) landed
`Process.clock_gettime` (`packages/ruby-compat/src/process.ts`, MRI
`vendor/ruby/process.c:8283`) and moved five bodies onto it. Ten more Rails
elapsed-time readings still measure with `Date.now()`, which is a wall clock
where Rails' is monotonic, and which forces a `/1000` at every read because
Rails' answer is already float seconds:

- `packages/activerecord/src/connection-adapters/abstract-adapter.ts:756,939,999,1008,1022,1080,1435,1440,1851,1867,1904`
  — Rails `abstract_adapter.rb:154,311,334,340,664,671,680,766,990,1019,1055`
  (`@idle_since`, `@last_activity`, `seconds_idle`, both `retry_deadline`s).
- `packages/activerecord/src/connection-adapters/abstract/connection-pool/queue.ts:220,228`
  — Rails `connection_pool/queue.rb:114,123` (`t0` / `elapsed`).
- `packages/activesupport/src/cache/memory-store.ts:213,220`
  — Rails `memory_store.rb:118,124` (`start_time` / `max_time`).

The call gate does not catch these — `clock_gettime` is not itself a ported
Rails method, so an omitted call on it is invisible to `parity:api:calls`. They
are found by grep, which is why they are a story rather than a red run.

## Acceptance criteria

- Every site above reads `Process.clockGettime(Process.CLOCK_MONOTONIC)`, with
  the `:float_millisecond` unit only where Rails passes it.
- The `/1000` and `* 1000` conversions those sites carry are gone, not moved:
  Rails' reading is already float seconds.
- No `Date.now()` remains in a body whose Rails counterpart calls
  `Process.clock_gettime`.
