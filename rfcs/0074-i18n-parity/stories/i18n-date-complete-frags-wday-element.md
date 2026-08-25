---
title: "complete_frags drops rt_complete_frags' wday element"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6099
claim: "2026-08-04T22:47:02Z"
assignee: "i18n-date-complete-frags-wday-element"
blocked-by: null
closed-reason: null
---

## Context

PR #6089 landed `parse_day`'s `:wday` (`date-3.4.1/ext/date/date_parse.c:583-592`),
so `Date._parse` now carries the field for every string that names a day. Nothing
reads it back on the civil side: `completeFrags` in `packages/i18n/src/date.ts`
carries only the `DateFrag` elements `"year" | "mon" | "mday" | "yday" | "hour" |
"min" | "sec"`, and Ruby's `rt_complete_frags` element table
(`date-3.4.1/ext/date/date_core.c:3878-3892`) has a `wday` entry too.

The gap is observable the moment `:wday` exists (verified against ruby 3.3.11 /
date 3.4.1, run on 2026-08-04):

```text
Date.parse("wednesday")   # Ruby: #<Date: 2026-08-05>, the Wednesday of this week
RubyDate.parse("wednesday")  # trails: raises Date::Error "invalid date"
```

Ruby completes the remaining civil elements from today and then resolves the
`:wday`-only frag; trails has no year/mon/mday, so `Date.parse` falls through to
its `d === null` arm and raises.

This is the civil counterpart of the commercial-arm gap already tracked by
`i18n-date-valid-commercial-day-check-and-wday-fallback` (that story covers
`rt__valid_date_frags_p`'s commercial arm reading `:cwday` and falling back to
`:wday` with `0` mapped to `7`); the two touch different arms and should not be
merged.

## Converged shape

- `DateFrag` grows `wday`, and `completeFrags` carries `rt_complete_frags`'
  `wday` element (`date_core.c:3878-3892`) rather than dropping it.
- `Date.parse` resolves a `:wday`-only (or `:wday`-plus-partial) frag the way
  `rt__valid_date_frags_p` does, against today.

## Acceptance criteria

- `Date.parse("wednesday")` answers the same date the interpreter answers, and
  so do `"sunday"` and `"sat"`.
- `Date.parse("wed 2008")` keeps raising `Date::Error "invalid date"`, as Ruby
  does — completion does not become a catch-all.
- No regression in the `date.trails.test.ts` battery.
