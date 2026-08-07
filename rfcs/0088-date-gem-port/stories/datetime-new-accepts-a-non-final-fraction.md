---
title: "DateTime.new accepts a fraction in a non-final time argument where num2int_with_frac raises"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6163
claim: "2026-08-07T01:48:27Z"
assignee: "datetime-new-accepts-a-non-final-fraction"
blocked-by: null
closed-reason: null
---

## Context

`DateTime.new` accepts a fraction in a non-final time argument where MRI raises.

```text
ruby 3.3.11: DateTime.new(2008, 3, 1, 6, 0.5, 0)  # => Date::Error: invalid fraction
trails:      new DateTime(2008, 3, 1, 6, 0.5, 0)  // builds silently
```

MRI's `num2int_with_frac` (`vendor/date/ext/date/date_core.c:3296-3304`) is the
guard: it splits the fraction off each argument in turn and raises
`eDateError, "invalid fraction"` when `argc > n` — i.e. when a LATER argument
was also passed, so the fraction is not in the final position. The `n` bounds
are the ones `datetime_initialize` passes: `3` for day, `4` for hour, `5` for
minute, and `positive_inf` for second (`date_core.c:7833-7847`), which is why a
fractional second is always legal.

The fraction of a legal non-final argument is also carried, via `add_frac` →
`d_lite_plus` — `DateTime.new(2008, 3, 1, 6, 0.5)` is `06:00:30` in MRI. trails
happens to agree there, but only because `time_to_df`'s `min * 60` arithmetic
lands on the same number; nothing carries a fractional HOUR, and nothing raises.

PR #6161 ported the fractional-second half of `num2int_with_frac` and left this
guard; filed rather than widened, since it needs the `argc` bound the TS
signature does not carry as such.

## Converged shape

`DateTime`'s public constructor ports `num2int_with_frac`'s guard for `day`,
`hour` and `minute` — raise `Date::Error("invalid fraction")` when the argument
carries a fraction and a later argument was supplied — and carries the fraction
through `add_frac`'s day-fraction arithmetic when it is legal, rather than
relying on `time_to_df`'s multiplication. `second` keeps its `positive_inf`
bound and is unchanged.

Ruby's `argc` has no direct TS analogue; the settled shape is optional
parameters with no defaults applied before the check, so "was it passed" stays
observable (`hour?: number` in the public overload already spells this).

## Acceptance criteria

- [ ] `DateTime.new(2008, 3, 1, 6, 0.5, 0)` raises `Date::Error` "invalid fraction";
      so do the fractional-day and fractional-hour non-final forms.
- [ ] `DateTime.new(2008, 3, 1, 6, 0.5)` is `06:00:30` and
      `DateTime.new(2008, 3, 1, 6.5)` is `06:30:00`.
- [ ] Integer-argument construction and the fractional-second path (PR #6161)
      are unchanged.
- [ ] Verify each value against a live `ruby -rdate -e`.
