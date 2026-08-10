---
title: "date-union-datedata-on-date"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6312
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`date_core.c` stores a date in a `union DateData` (`date_core.c:203-231`): a
`SimpleDateData` (nth, jd, sg, civil) or a `ComplexDateData` (the same plus
`df`, `sf`, `of`). Which one a given object carries is a `flags` bit, NOT its
class — `simple_dat_p` (`date_core.c:1140`) reads `flags`, and a `::Date` may
legitimately carry `ComplexDateData`.

trails collapses the two onto the class: `simpleDatP` in
`packages/date/src/date.ts` is `!(dat instanceof DateTime)`, and `#df` / `#sf` /
`#of` live on `DateTime` alone.

That is observably wrong for `d_lite_plus` (`date_core.c:5952-6272`), whose
float and rational arms end at `d_complex_new_internal(rb_obj_class(self), ...)`
— the receiver's OWN class — unless `!df && f_zero_p(sf) && !m_of(dat)`
(`date_core.c:6145`, `date_core.c:6250`). MRI:

    Date.new(2001, 1, 1) + Rational(1, 2)
    #=> a ::Date (not a DateTime) whose #day_fraction is (1/2)

`d_lite_day_fraction` (`date_core.c:5358-5372`) returns `0` only for
`simple_dat_p`; otherwise `m_fr(dat)`. So the fractional day is readable off a
`Date`, while `#hour` / `#sec` / `#zone` stay `DateTime`-only.

Found in review of PR #6312, which ported `Date#+`. Rather than silently drop
the fraction, `Date#dNewInternal` there RAISES `Date::Error` when handed a
non-zero `df`/`sf`/`of`, and `date.trails.test.ts` pins that. The raise is the
placeholder this story removes.

## Acceptance criteria

- [ ] `#df` / `#sf` / `#of` (and the stored UTC `#jd`) move down to `Date`, as
      `union DateData` has them, with `DateTime` reading rather than owning
      them. `#hour`/`#min`/`#sec`/`#secFraction`/`#zone`/`#offset` stay on
      `DateTime`, so `test__attr`'s `respond_to?` arm keeps passing.
- [ ] `simpleDatP` stops reading `instanceof DateTime` and reads the data shape,
      as the C's `flags` bit does.
- [ ] `Date#dNewInternal` builds a complex-backed `Date` instead of raising; the
      raise and its `date.trails.test.ts` cover are deleted, not rewritten.
- [ ] `Date.new(2001, 1, 1).plus(new Rational(1, 2)).dayFraction` is
      `Rational(1, 2)` and the value is a `Date`, not a `DateTime`.
- [ ] `pnpm parity:test --package date` does not regress; `pnpm vitest run
packages/date/src` is green.
