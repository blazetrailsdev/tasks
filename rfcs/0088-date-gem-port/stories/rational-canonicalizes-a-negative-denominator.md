---
title: "Rational() canonicalizes the sign onto the numerator, as nurat_s_canonicalize_internal does"
status: done
updated: 2026-08-17
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6635
claim: "2026-08-17T09:37:51Z"
assignee: "port-date-time-to-fs-onto-the-datetime-receiver"
blocked-by: null
closed-reason: null
---

## Context

`Rational`'s constructor (`packages/date/src/date.ts`, `class Rational`) cancels
by `iGcd` but never normalizes the SIGN, so a negative denominator survives:

    new Rational(3, -4)   // numerator 3n, denominator -4n

Ruby canonicalizes the sign onto the numerator
(`rational.c` `nurat_s_canonicalize_internal`, which calls
`nurat_canonicalize` / `f_negative_p` on the denominator and negates BOTH
parts). On ruby 3.3.11:

    Rational(3, -4)   #=> (-3/4)
    Rational(-1.5, 4) #=> (-3/8)     # trails already agrees here

So `numerator` / `denominator` read back with the wrong signs for the negative-
denominator case, `inspect`/`toS` spell `(3/-4)` where Ruby spells `(-3/4)`,
and any body that tests `numerator < 0` for the sign of the value is wrong.
The Float arm added by `rational-constructor-takes-a-float-numerator` (PR #6628)
does not change this — it divides through the same uncanonicalized path — and
that PR deliberately left the behaviour alone so no existing Integer-argument
result would shift.

## Converged shape

Canonicalize in the constructor as `nurat_s_canonicalize_internal` does: after
the gcd cancel, if the denominator is negative, negate both parts. Then check
every reader and comparison in `packages/date/src/date.ts` (`cmp`, `div`,
`floor`, `toS`, `inspect`, the `date_core.c` offset paths that build
`Rational(of, 86400)` with a negative `of`) for a body that was compensating
for the old spelling.

Ruby anchors: `rational.c` `nurat_s_canonicalize_internal`,
`nurat_canonicalize`.

## Acceptance criteria

- [ ] `new Rational(3, -4)` answers numerator `-3n`, denominator `4n`, matching
      `ruby -e 'p Rational(3, -4)'`.
- [ ] A negative denominator arriving through the Float arm
      (`Rational(1, -0.5)`) canonicalizes the same way.
- [ ] No existing `packages/date` or `packages/activesupport` result changes;
      the date/activesupport suites stay green.
