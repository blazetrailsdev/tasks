---
title: "day-fraction-reader-answers-a-number-on-the-whole-day-arm"
status: closed
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
closed-reason: "Invalid — the premise is wrong. Verified on ruby 3.3.11: (Date.new(2001,1,1) + Rational(2,1)).day_fraction is the INTEGER 0, not (0/1). rb_rational_new folds a denominator of one, and day_fraction is built through it, so trails answering the number 0 there matches MRI. Filed off a bad reading of Rational() (which does NOT fold: Rational(9,3) is (3/1), class Rational). Nothing to converge."
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

> **CORRECTION (2026-08-13, via
> `audit-the-disproven-rational-canonicalization-premise`): that last paragraph
> has it exactly backwards**, which is the reading the `closed-reason` above
> already overturns. Arithmetic does NOT fold — on ruby 3.3.11
> `(Rational(1,2) * 12)` is `(6/1)`, class `Rational`, and `Rational(9,3)` is
> `(3/1)`. `rb_rational_new`, the CONSTRUCTOR a reader like `day_fraction`
> answers through, is the one that folds, which is why
> `(Date.new(2001,1,1) + Rational(2,1)).day_fraction` is the Integer `0`.

## Acceptance criteria

- [ ] `Date#dayFraction` answers a `Rational` on every arm, `(0/1)` included.
- [ ] Sibling always-Rational readers (`#secFraction`, `#ajd`, `#amjd`,
      `#offset`) audited for the same number/Rational split.
- [ ] `date.trails.test.ts`'s whole-Rational `plus` case asserts
      `dayFraction` again rather than `jd`.
