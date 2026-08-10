---
title: "day-fraction-reader-answers-a-number-on-the-whole-day-arm"
status: ready
updated: 2026-08-10
rfc: "0088-date-gem-port"
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

`Date#day_fraction` (`date_core.c` `d_lite_day_fraction`) is
`rb_rational_new(m_df(dat), INT2FIX(DAY_IN_SECONDS))` — ALWAYS a Rational, so
`(Date.new(2001,1,1) + Rational(2,1)).day_fraction` is `(0/1)` in MRI.

trails' reader answers the JS number `0` on the whole-day arm and a `Rational`
otherwise: on this branch

```ts
expect(new RubyDate(2001, 1, 1).plus(new Rational(2, 1)).dayFraction).toEqual(new Rational(0, 1)); // fails: received +0
```

while `packages/date/src/date.trails.test.ts:42` asserts a `Rational` for the
half-day case. Surfaced while porting `wholenum_p` into `Date#plus`
(PR for `rational-does-not-canonicalize-denominator-one-to-integer`); the test
there had to assert `jd` instead of `day_fraction` to stay green.

Note this is the OPPOSITE direction from Ruby's Rational canonicalization: a
Rational reader stays a Rational in MRI even at denominator 1 — it is the
arithmetic RESULT that folds to an Integer, not the constructed value a reader
answers.

## Acceptance criteria

- [ ] `Date#dayFraction` answers a `Rational` on every arm, `(0/1)` included.
- [ ] Sibling always-Rational readers (`#secFraction`, `#ajd`, `#amjd`,
      `#offset`) audited for the same number/Rational split.
- [ ] `date.trails.test.ts`'s whole-Rational `plus` case asserts
      `dayFraction` again rather than `jd`.
