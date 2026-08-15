---
title: "Converge Notifications::Event to Rails' constructor and time representation, then port the Instrumenter/Event residue"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6561
claim: "2026-08-15T12:15:05Z"
assignee: "batch-enumerator-carries-cursor-order-use-ranges"
blocked-by: null
closed-reason: null
---

# Port the Notifications Instrumenter/Event residue

## Context

Split out of `port-notifications-fanout-instrumenter-residue`, whose own Notes
anticipated two PRs ("fanout; instrumenter + module readers"). The fanout and
module-reader halves landed in PR #<fanout-pr>: `notifications/fanout.rb` is now
29/29 and `notifications.rb` 11/11 in `pnpm parity:api`.

`notifications/instrumenter.rb` remains at **11/25**, 14 missing:

- `Instrumenter#new_event` (instrumenter.rb:82), `#finish_with_state` (:96),
  `#unique_id` (:100)
- `Event#record` (:132), `#start!` (:145), `#finish!` (:152), `#cpu_time`
  (:161), `#idle_time` (:167), `#allocations` (:174), `#gc_time` (:180),
  and the private `#now` / `#now_cpu` / `#now_gc` / `#now_allocations`
  (:196-227)

The blocker is that trails' `Event`
(`packages/activesupport/src/notifications/instrumenter.ts:22-60`) is a
different object from Rails': its constructor is
`(name, start: Temporal.Instant, payload, transactionId)` where Rails'
is `(name, start, ending, transaction_id, payload)` with the times kept as
float milliseconds in `@time`/`@end`; it has no `start!`/`finish!` pair (a
trails `finish(endTime?)` stands in) and carries a trails-only `children`
array. Adding the missing members without converging the constructor and the
time representation would leave two incompatible halves in one class, so this
is one refactor, not fourteen additions.

Call sites to move with it: `EventObjectGroup#buildEvent`
(`notifications/fanout.ts`), `Handle#start`
(`notifications/instrumenter.ts`), and `Notifications.publish`
(`notifications.ts`). `Event#time` becomes seconds (Rails `@time / 1000.0`),
which is what `Fanout::Subscribers::Evented#publish_event` already forwards to
timed listeners; `#duration` stays milliseconds, so
`packages/actionpack/src/action-controller/log-subscriber.ts`,
`packages/activerecord/src/log-subscriber.ts` and
`packages/activerecord/src/runtime-registry.ts` are unaffected.

**Scope judgement the implementer must make explicitly, not silently:** the GC
and allocation counters (`gc_time`, `allocations`, `now_gc`,
`now_allocations`) read Ruby's `GC.total_time` and
`GC.stat(:total_allocated_objects)`, which have no Node equivalent reachable
without `node:*` imports. Do NOT stub them to `0` — a zero-returning port is a
silent divergence that reads as ported. Take `SKIP_GROUPS` entries in
`scripts/parity/conventions.ts` with a stated reason instead. `cpu_time`,
`idle_time`, `now` and `now_cpu` do have analogues (`performance.now()`) and
should be ported.

## Acceptance criteria

- [ ] `notifications/instrumenter.rb` reports 0 missing members in
      `pnpm parity:api`, or the residue carries `SKIP_GROUPS` entries with a
      stated reason each.
- [ ] No GC/allocation counter is stubbed to a constant.
- [ ] `Event`'s constructor and `#time`/`#end`/`#duration` match Rails.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; no new
      baseline rows.
- [ ] `pnpm parity:api:extra --package activesupport` shows no new untraceable
      public surface.
