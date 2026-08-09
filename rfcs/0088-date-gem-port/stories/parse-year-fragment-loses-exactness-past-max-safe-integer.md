---
title: "parse-year-fragment-loses-exactness-past-max-safe-integer"
status: claimed
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-09T21:39:14Z"
assignee: "parse-year-fragment-loses-exactness-past-max-safe-integer"
blocked-by: null
closed-reason: null
---

## Context

`Date._parse`'s year fragment is built with `Number(...)` in five places in
`packages/date/src/date.ts` (the ISO arm around `:1337`, and `:1712`, `:1810`,
`:1902`, plus `cwyear` at `:1644`), so a year whose digit string outruns
`Number.MAX_SAFE_INTEGER` arrives as an inexact double.

MRI's parser answers an exact Integer at any width — the fragment is built with
Ruby's `String#to_i`:

```ruby
ruby -rdate -e 'p Date._parse("1180591620717411303424-01-01")'
#=> {:year=>1180591620717411303424, :mon=>1, :mday=>1}
ruby -rdate -e 'p Date.parse("1180591620717411303424-01-01").to_s'
#=> "1180591620717411303424-01-01"
```

PR #6297 seated `nth` on `Date`/`DateTime` and threaded `decode_jd` through
`rt__valid_civil_p` / `d_new_by_frags` / `dt_new_by_frags`
(`vendor/date/ext/date/date_core.c:4152,4315,8311`), so the frag builders now
carry a year of any magnitude they are HANDED — `DateParts.jd` was widened to
`number | bigint` and is covered by a test. `DateParts.year` was left a
`number`: widening it there surfaces six call sites that feed the ordinal,
commercial and week-number helpers, whose `valid_ordinal_p` /
`valid_commercial_p` / `valid_*_p` decode arms
(`date_core.c:2200-2245`) are not ported yet.

## Acceptance criteria

- [ ] The `:year` / `:cwyear` fragments are exact at any digit width, as Ruby's
      `String#to_i` is, and `Date._parse("1180591620717411303424-01-01")`
      answers the exact year.
- [ ] `DateParts.year` / `DateParts.cwyear` are `number | bigint`, and the
      ordinal / commercial / week-number arms decode their year the way
      `valid_ordinal_p` and `valid_commercial_p` do rather than narrowing it.
- [ ] A `date.trails.test.ts` case asserts the parse round trip against a live
      `ruby -rdate -e`.
