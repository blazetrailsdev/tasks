---
title: "date_zone_to_diff answers a float where Ruby answers a Rational"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6089
claim: "2026-08-04T20:32:03Z"
assignee: "i18n-date-parse-day-sets-wday"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/date.ts` `dateZoneToDiff` (ported by PR #6080 from
ruby/date `date-3.4.1/ext/date/date_parse.c:415-559`) answers a `number` for
every offset. Ruby does not: the fractional-hour branch
(`date_parse.c:505-529`) builds a **Rational** whenever the fraction runs to
more than two decimal places —

```c
VALUE denom = rb_int_positive_pow(10, (int)(n - 2));
offset = f_add(rb_rational_new(INT2FIX(sec), denom), INT2FIX(hour * 3600));
if (rb_rational_den(offset) == INT2FIX(1))
    offset = rb_rational_num(offset);
```

so `Date._parse("2008-07-02 10:30:00 +9.5555")[:offset]` is `(171999/5)` in
Ruby (verified against ruby 3.3.11 / date 3.4.1) and the float `34399.8` in
trails. The two agree in magnitude here, but the _type_ differs, and a
fraction whose Rational is not exactly representable in binary floating point
will differ in value too. Only when the Rational reduces to denominator 1
(`+9.555` → `34398`) are the two identical, which is why every case in
`date.trails.test.ts` currently passes.

The deviation is cited at the call site in `dateZoneToDiff`'s JSDoc as a
TypeScript language limit — trails has no Rational. That citation is a
burndown row, not a settled decision.

## Converged shape

A Rational value type (`Numeric#Rational`, `rational.c`) that `dateZoneToDiff`
can answer, so `:offset` carries the exact value Ruby's Hash does and a future
`::Time` / `::DateTime` parser reading the field does not silently round. If
`packages/activesupport` or `packages/i18n` gains a Rational for another
reason first, this branch should switch to it rather than keeping the float.

Scope is the `n > 2` arm of the fractional-hour branch plus whatever minimal
Rational surface it needs — not a general Numeric tower.

## Acceptance criteria

- `Date._parse("2008-07-02 10:30:00 +9.5555")` answers the `:offset` the
  interpreter answers, exactly, not a rounded `number`.
- The integer-reducing cases keep answering plain integers, as
  `rb_rational_den(offset) == INT2FIX(1)` makes Ruby do (`+9.555` → `34398`,
  `+9.5` → `34200`).
- The Rational-limit note in `dateZoneToDiff`'s JSDoc is removed, not reworded.
