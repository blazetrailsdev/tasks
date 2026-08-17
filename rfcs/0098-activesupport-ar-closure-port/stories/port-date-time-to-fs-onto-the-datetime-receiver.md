---
title: "port-date-time-to-fs-onto-the-datetime-receiver"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6635
claim: "2026-08-17T09:37:51Z"
assignee: "port-date-time-to-fs-onto-the-datetime-receiver"
blocked-by: null
closed-reason: null
---

## Context

`core_ext/date_time/conversions.rb` now buckets to
`packages/activesupport/src/core-ext/date-time/conversions.ts` (PR for
`port-date-time-conversions-onto-its-own-receiver`), where it scores 6/10.
The four members still missing are the `to_fs` cluster:

- `to_fs` (`conversions.rb:35-40`) — `Time::DATE_FORMATS[format]`, then
  `formatter.call(self).to_s` or `strftime(formatter)`, else `to_s`.
- `to_formatted_s` (`:42`), the alias.
- `readable_inspect` (`:56-58`) — `to_fs(:rfc822)`.
- `default_inspect` (`:59`), the alias of the original `inspect`.

Two things block a faithful port and are the real work here:

1. `Time::DATE_FORMATS` (`core_ext/time/conversions.rb:8-27`) is not ported
   anywhere. `time-ext.ts`'s `toFs(date: Date)` is a hand-rolled `switch` over
   format names — itself a divergence — and none of the lambda entries
   (`long_ordinal`, `rfc822`, `rfc2822`, `iso8601`) exist.
2. `@blazetrails/date`'s `Date#strftime` (`packages/date/src/date.ts`, near
   `strftime(format = "%Y-%m-%d")`) hardcodes `hour: 0`, `min: 0`, `sec: 0`,
   `zone: "+00:00"`, and `DateTime` does NOT override it, so a DateTime's time
   of day and offset are dropped. `date_core.c`'s `dt_lite_strftime` passes the
   receiver's own time and offset. Every `DATE_FORMATS` entry with a time
   directive answers the wrong string until that override exists.

`date_time_ext_test.rb:16-46` (`test_to_fs`, `test_to_fs_with_custom_date_format`,
`test_readable_inspect`) is the test to converge; the trails counterparts in
`packages/activesupport/src/core-ext/date-time-ext.test.ts` ("to fs",
"readable inspect", "to fs with custom date format") are placeholders over a JS
`Date` today.

## Acceptance criteria

- [ ] `DateTime#strftime` is ported in `packages/date` over the receiver's own
      hour/min/sec/sec_fraction/offset (`date_core.c` `dt_lite_strftime`).
- [ ] `Time::DATE_FORMATS` is ported at `core_ext/time/conversions.rb`'s
      spelling, lambdas included.
- [ ] `to_fs` / `to_formatted_s` / `readable_inspect` / `default_inspect` are
      ported on `core-ext/date-time/conversions.ts`, taking the bucket to 10/10.
- [ ] The three placeholder tests above carry Rails' assertions.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative;
      `parity:api:calls` / `:args` clean.
