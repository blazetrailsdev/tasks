---
title: "counter-cache touch: accepts { time: } hash form (Rails update_counters/reset_counters)"
status: done
updated: 2026-07-01
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4361
claim: "2026-07-01T03:54:49Z"
assignee: "counter-cache-touch-time-hash-option"
blocked-by: null
---

## Context

Rails `update_counters` / `reset_counters` / `increment_counter` accept
`touch:` in the rich `{ time: Time.now.utc }` form (and `touch: { time: }`
alongside column names), passed through to
`ActiveRecord::Timestamp#touch_attributes_with_time(*names, time:)` so the
touched timestamps are set to the supplied instant rather than "now". See
activerecord/lib/active_record/counter_cache.rb (`update_counters`) and
activerecord/lib/active_record/timestamp.rb (`touch_attributes_with_time`).

trails' counter-cache touch option (`updateCounters` / `resetCounters` /
`incrementCounter` / `decrementCounter` `{ touch }`, counter-cache.ts +
relation/\*) accepts only `true | string | string[]` — the `{ time: }` hash form
is unsupported and renders as a bogus `[object Object]` column. While porting
`counter_cache_test.rb` "reset multiple counters with touch: true"
(vendor/rails/activerecord/test/cases/counter_cache_test.rb:349-354) onto
canonical models, the body — Rails `reset_counters(@topic.id, :replies,
:unique_replies, touch: { time: Time.now.utc })` — had to use `touch: true` as
the observable-equivalent (updated_at advances past the staged time) in
packages/activerecord/src/counter-cache.test.ts.

## Acceptance criteria

- [ ] The counter-cache touch option accepts `{ time: <Temporal/Date> }`
      (and `{ time: }` combined with explicit column names), applying the given
      time to the touched timestamp columns, matching Rails'
      `touch_attributes_with_time(*names, time:)`.
- [ ] Restore counter-cache.test.ts "reset multiple counters with touch: true"
      to the literal Rails `touch: { time: ... }` form and drop the
      `touch: true` substitution + its explanatory comment.
