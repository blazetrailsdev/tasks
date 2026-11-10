---
title: "date-time-localtime-and-datetime-jd"
status: draft
updated: 2026-11-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TZInfo::Timestamp#to_time` and `#new_datetime` (`vendor/tzinfo/v2.0.6/lib/tzinfo/timestamp.rb:396-404`,
`:504-509`) call `Time#localtime(offset)` and `DateTime.jd(rational)`. `@blazetrails/date` has
neither in usable form:

- `Time` (`packages/date/lib/time.ts`) has `getlocal` but no `localtime`
  (`time_localtime_m`, `vendor/ruby/v3.3.11/time.c:4210`).
- `DateTime.jd` (`packages/date/lib/date.ts:6044`) ends in `.toDatetime()` and answers a Temporal
  value, not a `DateTime`, so `.gregorian` is not callable on it (`d_lite_s_jd`/`datetime_s_jd`,
  `vendor/ruby/v3.3.11/ext/date/date_core.c`).

`packages/tzinfo/lib/timestamp.ts` works around both with `getlocal` and
`new DateTime(-4712, 1, 1).plus(days)`, receipted `@missingRailsCall … CONVERGEABLE` on this story.

## Acceptance criteria

- [ ] `Time#localtime(utc_offset = nil)` ported (mutating, like MRI).
- [ ] `DateTime.jd` answers a `DateTime`.
- [ ] `Timestamp#toTime` / `#newDatetime` call `localtime` / `klass.jd(...)`, receipts removed.
