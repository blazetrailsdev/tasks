---
title: "Date#to_s renders a pre-1000 year unpadded; date_strftime's %Y pads to four digits"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6136
claim: "2026-08-05T16:53:06Z"
assignee: "date-to-s-does-not-zero-pad-the-year"
blocked-by: null
closed-reason: null
---

## Context

`Date#to_s` renders a year without zero-padding to four digits: a
4536-construction differential against `ruby 3.3.11 -rdate` (run while shipping
`date-state-lacks-simple-date-data-flags`, PR #6129) matched Ruby on every
field — year, mon, mday, wday, yday, `julian?`, `start` — and diverged on
`to_s` alone, for every year under 1000:

    ruby:   0001-01-01
    trails: 1-01-01

ruby/date's `d_lite_to_s` goes through `date_format` /
`rb_str_format`-equivalent `%.4d` for the year
(`vendor/date/ext/date/date_core.c`, `d_lite_to_s` → `date_strftime` with
`"%Y-%m-%d"`, and `date_strftime.c`'s `%Y` arm pads to at least four digits).
Rails hits this through `Date#to_s`/`to_fs(:db)` on any pre-1000 date.

## Converged shape

`toS` pads the year to four digits the way `date_strftime.c`'s `%Y` does,
including the negative-year spelling. Re-run the differential at zero
mismatches on the `to_s` column (it is the only column that fails today).

## Acceptance criteria

- [ ] `new Date(1, 1, 1).toS()` is `"0001-01-01"`, matching `ruby -rdate`.
- [ ] Negative and >9999 years match Ruby's rendering too.
- [ ] The construction differential is at zero mismatches with the `to_s`
      column included.
