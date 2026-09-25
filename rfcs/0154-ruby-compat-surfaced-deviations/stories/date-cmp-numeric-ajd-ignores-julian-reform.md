---
title: "cmp's Date<=>Numeric ajd is proleptic Gregorian where Ruby's Date uses the ITALY reform"
status: draft
updated: 2026-09-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8076 added `Date#<=>`'s `cmp_gen` Numeric arm (`vendor/ruby/ext/date/date_core.c:6701-6710`, compare on `m_ajd`) to ruby-compat's `cmp` (`packages/ruby-compat/src/comparable.ts`). `mAjd` computes the astronomical Julian day of a Temporal PlainDate / PlainDateTime from its ISO fields with a proleptic-Gregorian `days_from_civil`. Ruby's `Date` defaults to `Date::ITALY` (start of the Gregorian reform), so dates before 1582-10-15 are Julian-calendar dates:

```ruby
Date.new(1500,1,1).ajd.to_f                   # => 2268932.5
Date.new(1500,1,1,Date::GREGORIAN).ajd.to_f   # => 2268923.5
```

`mAjd` answers the second value where Ruby answers the first, so `cmp(date, n)` for a pre-reform date disagrees with MRI by up to ~10 days of ajd.

## Acceptance criteria

- `mAjd` honours the `ITALY` reform the way `m_ajd` → `c_civil_to_jd` does (`date_core.c`), or reuses `@blazetrails/date`'s `ajd` if ruby-compat's leaf rule allows it.
- A test pins `cmp({year:1500,month:1,day:1, PlainDate tag}, 2268932.5) === 0`.
