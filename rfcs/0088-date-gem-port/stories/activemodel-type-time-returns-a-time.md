---
title: "activemodel-type-time-returns-a-time"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6154
claim: "2026-08-06T13:40:06Z"
assignee: "activemodel-type-time-returns-a-time"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type::Time` answers a `::Time` in Rails —
`activemodel/lib/active_model/type/time.rb:16-23` documents
`event.start.class # => Time`, normalized to 2000-01-01 in the UTC zone, and
`cast_value` (`time.rb:68-83`) builds it with `Helpers::TimeValue#new_time`.

Trails' `TimeType` (`packages/activemodel/src/type/time.ts`) answers a
`Temporal.PlainTime` instead, and two divergences fall out of that, both
surfaced by PR #6151 (which routed the body through the date gem's
`::Date._parse` and left the rest alone):

1. **`:offset` is dropped.** Rails passes it to `new_time`, which shifts the
   instant — `event.start = "00:01:02+03:00"` is `1999-12-31 21:01:02 UTC`
   (`time.rb:26-27`). A `PlainTime` has no instant to shift, so trails keeps
   `00:01:02`.
2. **`:sec_fraction` is normalized where Rails does not.** Rails hands
   `new_time` the raw `sec_fraction` — a Rational of a _second_ — as
   `Time.utc`'s _microsecond_ argument, so `Time.utc(2000,1,1,15,30,45,
Rational(123456,1000000)).usec` is `0` (verified on ruby 3.3.11) and a
   string's sub-second digits are lost. `Type::DateTime` calls its
   `microseconds` helper first (`date_time.rb:73`); `Type::Time` does not.
   Trails normalizes in both, so it keeps precision Rails drops.

Both are cited in `castValue`'s JSDoc as of #6151.

## Acceptance criteria

- [ ] `TimeType`'s cast result carries an instant, so `new_time`'s `:offset`
      arm can be ported and `"00:01:02+03:00"` lands where Rails puts it.
- [ ] `:sec_fraction` reaches `new_time` the way Rails' `Type::Time` sends it,
      or the deviation is retired with a cited reason if the return-type change
      makes it unreachable.
- [ ] The JSDoc note in `packages/activemodel/src/type/time.ts` naming this
      story is removed.
- [ ] Callers of `TimeType` across activerecord (`type/time.ts`, the adapter
      OID types, `userInputInTimeZone`) are updated with it.
