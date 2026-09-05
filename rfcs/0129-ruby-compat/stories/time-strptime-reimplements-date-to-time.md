---
title: "Time.strptime reimplements Date#to_time instead of calling it"
status: draft
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Time.strptime` (`vendor/ruby/lib/time.rb:456-506`) has one arm that leaves the
`Time` machinery entirely:

```ruby
if (d[:cwyear] && !year) || ((d[:cwday] || d[:cweek]) && !(d[:mon] && d[:mday]))
  # make_time doesn't deal with cwyear/cwday/cweek
  return Date.strptime(date, format).to_time
end
if (d[:wnum0] || d[:wnum1]) && !yday && !(d[:mon] && d[:mday])
  yday = Date.strptime(date, format).yday
end
```

Both lines call a `Date` method on the result of `Date.strptime`. trails'
`Date.strptime` (`packages/date/src/date.ts:4730`) ends in `.toDate()` and
answers a `Temporal.PlainDate`, not a `Date`, so neither `Date#to_time`
(`date.ts:5483`) nor `Date#yday` is reachable from the value it returns.

PR #7528 ported the method with both lines spelled around that:

- `.to_time` became an inline `Time.local(plainDate.year, plainDate.month,
  plainDate.day)` — `Date#to_time`'s own body (`date.ts:5483-5490`, a local-zone
  `PlainDateTime`) copied to the call site, plus a `plainDate` temporary Ruby
  does not have.
- `.yday` became `Temporal.PlainDate#dayOfYear`.

The first is a real decomposition divergence: one Rails call becomes a
re-implementation of the callee. It is also fragile — `Date#to_time` routes
through `gregorian()` and `realYearToLong` for Julian dates and long years,
which the inline copy drops.

`packages/date/src/time.ts` `Time.strptime` is the only call site.

## Converged shape

Reach `Date#to_time` and `Date#yday` from what `Date.strptime` answers, so both
lines read as the single Rails calls they are. The natural fix is whatever
`0088-date-gem-port`'s (now closed) `date-state-onto-temporal-plaindate` settles for the
`Date` / `Temporal.PlainDate` boundary — if a `Date` value stays reachable
there, `Time.strptime`'s two lines collapse back to
`Date.strptime(date, format).toTime()` and `.yday`. Until then this is the one
place in the file that reimplements a callee instead of calling it.

Note `Date#to_time` answers a `Temporal.ZonedDateTime` while `Time.strptime`
must return a `Time`, so the converged shape has to settle that seam too, not
just the reachability.

## Acceptance criteria

- `Time.strptime`'s cwyear/cwday/cweek arm is a single call standing in for
  `Date.strptime(date, format).to_time`, with no copy of `Date#to_time`'s body
  and no `plainDate` temporary.
- The `wnum0`/`wnum1` arm reads as Rails' `.yday`.
- The Julian / long-year handling `Date#to_time` does is not lost.
- The `Time.strptime` cases in `packages/date/src/time.trails.test.ts` still
  pass, expectations unchanged.
