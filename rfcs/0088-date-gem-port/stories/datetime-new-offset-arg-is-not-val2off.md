---
title: "DateTime.new's offset argument takes seconds, where val2off takes a day fraction"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6172
claim: "2026-08-07T13:39:44Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6151 review round 1, which caught the port applying
`dt_new_by_frags`' seconds bound on a path Ruby routes through `val2off`.

Ruby's `DateTime.new(y, m, d, h, min, s, offset, start)` reads `offset` through
`val2off` (`date_core.c:5071-5077`) over `offset_to_sec`
(`date_core.c:2370-2440`), which takes a **day fraction**, not seconds:

- the Fixnum arm (`date_core.c:2376-2385`) accepts only `-1`, `0` and `1` and
  multiplies by `DAY_IN_SECONDS`;
- the Float arm (`:2386-2397`) multiplies by `DAY_IN_SECONDS` and bounds at
  `±DAY_IN_SECONDS`;
- the Rational/default arm (`:2398-`) goes through `day_to_sec`;
- a String such as `"+09:00"` is accepted too;
- anything it rejects warns `"invalid offset is ignored"` and becomes `0`.

Verified on ruby 3.3.11:

```ruby
DateTime.new(2000,1,1,0,0,0, 1).zone   #=> "+24:00"   (1 day)
DateTime.new(2000,1,1,0,0,0, 9).zone   #=> "+00:00"   (rejected)
DateTime.new(2000,1,1,0,0,0, 24).zone  #=> "+00:00"   (rejected)
DateTime.new(2000,1,1,0,0,0, -5).zone  #=> "+00:00"   (rejected)
DateTime.new(2000,1,1,0,0,0, "+09:00").zone #=> "+09:00"
```

`packages/date/src/date.ts`'s constructor takes the `of` **seconds** instead —
the `d_complex_new_internal` field, one layer below — so `new DateTime(2000, 1,
1, 0, 0, 0, 1)` is one second east of UTC where Ruby's is one day. PR #6151
documents this at the call site and notes that its only non-test caller,
`dtNewByFrags`, already holds seconds from `date_zone_to_diff`, so nothing in
the port depends on the divergence today. It is still an observable API
difference for a direct caller.

## Converged shape

Port `offset_to_sec` and the `val2off` wrapper under their Rails names, and have
the `DateTime` constructor take Ruby's argument: a String, a `Rational` of a
day, or a numeric read as a day fraction, warning-and-zeroing what
`offset_to_sec` rejects. `dtNewByFrags` keeps passing seconds by constructing
through whatever internal entry point the seconds path needs — Ruby's own
`dt_new_by_frags` does not go through `val2off` either, it sets `of` directly
(`date_core.c:8297-8306`).

Note `offset_to_sec`'s Rational arm needs `Rational` division that
`packages/date/src/date.ts`'s minimal `Rational` (`:500-524`) does not have yet;
extend it rather than working around it.

## Acceptance criteria

- [ ] `offset_to_sec` / `val2off` ported under their Rails names with the
      Fixnum, Float, Rational and String arms.
- [ ] `DateTime.new`'s `offset` argument matches the five ruby 3.3.11
      transcripts above.
- [ ] `dtNewByFrags` still applies `dt_new_by_frags`' own seconds bound
      (`date_core.c:8297-8306`) and its test still passes.
- [ ] The constructor JSDoc's paragraph explaining why the port took seconds is
      deleted, not reworded.
