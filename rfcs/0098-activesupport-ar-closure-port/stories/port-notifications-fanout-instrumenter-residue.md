---
title: "Port the Notifications residue: Fanout, Instrumenter and the module readers"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6555
claim: "2026-08-15T00:15:05Z"
assignee: "converge-activesupport-non-constructor-argument-rows"
blocked-by: null
closed-reason: null
---

# Port the Notifications residue: Fanout, Instrumenter and the module readers

## Context

Measured 2026-08-14 (full `pnpm build` + `pnpm parity:api`, in-closure
activesupport at 948/1115). The `ActiveSupport::Notifications` cluster is the
second-largest in-closure hole at **30 missing members across three files**, and
RFC 0098 has never filed a story against any of them. All three TS files exist
and are substantial, so this is completion work, not a fresh port.

`notifications/fanout.rb` → `packages/activesupport/src/notifications/fanout.ts`
(520 lines) — 13 missing:

- `Fanout#publish` (:289), `Fanout#wait` (:315)
- `Fanout::BaseGroup#each`, `Fanout::MonotonicTimedGroup#now`,
  `Fanout::EventObjectGroup#build_event`, `Fanout::Handle#ensure_state!`
- `Fanout::Subscribers::Matcher#exclusions`, `#unsubscribe!`, `#wrap` (:318+)
- `Fanout::Subscribers::Evented#silenceable`, `#group_class`, `#silenced?`,
  `#subscribed_to?`

`notifications/instrumenter.rb` →
`packages/activesupport/src/notifications/instrumenter.ts` (287 lines) — 14
missing:

- `Instrumenter#new_event` (:82), `#finish_with_state` (:96), `#unique_id`
- `Event#record` (:132), `#start!`, `#finish!`, `#cpu_time`, `#idle_time`,
  `#allocations`, `#gc_time`, `#now`, `#now_cpu`, `#now_gc`, `#now_allocations`
  (class at :106)

`notifications.rb` → `notifications.ts` — 3 missing: `#notifier`, `#notifier=`,
`#registry`.

**Scope judgement the implementer must make explicitly, not silently:** the
`Event` timing members are the part most likely to need `SKIP_GROUPS` rather
than ports. `cpu_time`, `gc_time`, `allocations`, `now_cpu`, `now_gc` and
`now_allocations` read Ruby's `Process.clock_gettime(:CPU)`, `GC.stat` and
`GC.total_allocated_objects` — there is no Node equivalent for the GC and
allocation counters. Do not stub them to `0`: a zero-returning port is a silent
divergence that reads as ported. Either port what Node can actually measure
(`cpu_time` and `idle_time` have real analogues) and take `SKIP_GROUPS` entries
with reasons for the rest, or take the whole timing group as a skip group. Say
which in the PR.

`Fanout#publish` / `#wait` and the `Subscribers::Matcher`/`Evented` predicates
have no such excuse and should be straight ports.

## Acceptance criteria

- [ ] `notifications.rb`, `notifications/fanout.rb` and
      `notifications/instrumenter.rb` report **0 missing members** in
      `pnpm parity:api`, or the residue carries `SKIP_GROUPS` entries in
      `scripts/parity/conventions.ts` with a stated reason each.
- [ ] No GC/allocation counter is stubbed to a constant. Any member trails
      cannot measure is a skip with a reason, not a zero.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; no new
      baseline rows.
- [ ] `pnpm parity:api:extra --package activesupport` shows no new untraceable
      public surface.

## Notes

Likely two PRs (fanout; instrumenter + module readers). Split by file and file
the second as its own story rather than fanning out from one claim.
