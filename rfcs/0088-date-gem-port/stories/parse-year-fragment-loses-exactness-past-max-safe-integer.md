---
title: "Date._parse's year fragment loses exactness past MAX_SAFE_INTEGER, where Ruby's String#to_i is exact"
status: closed
updated: 2026-08-19
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do (RFC 0088 owner, 2026-08-18): accepted divergence, not a converged one. Date._parse builds its :year/:cwyear fragments with Number(...) in five places (date.ts ~:1337 ISO arm, :1644 cwyear, :1712, :1810, :1902), so a year past Number.MAX_SAFE_INTEGER arrives as an inexact double where MRI's String#to_i answers an exact Integer at any width. Closed on reachability and cost, not on correctness: (1) no gate measures it — date is at 137/137 (100%) on parity:test as of dcffeff21, and no ported gem test exercises a 17+ digit year; (2) the 140 est-loc is understated — the story body records that widening DateParts.year surfaces six call sites feeding the ordinal/commercial/week-number helpers whose valid_ordinal_p / valid_commercial_p decode arms (date_core.c:2200-2245) are NOT ported, so doing it faithfully means porting that surface first. Reopen if a real input ever needs a year past 2^53, or if the valid_*_p decode arms get ported for another reason — at that point the fragment widening is nearly free. NOTE: the divergence is not currently recorded at any of the five call sites; the existing MAX_SAFE_INTEGER comments in date.ts (:363, :1205, :1246) cover Rational's numerator, a different path. A one-line note at the parse site would stop this being rediscovered and re-filed."
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
