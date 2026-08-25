---
title: "Port Date#amjd, the last of the ajd/amjd/mjd/ld family"
status: done
updated: 2026-08-13
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6471
claim: "2026-08-13T15:55:42Z"
assignee: "port-relation-sum-block-arm"
blocked-by: null
closed-reason: null
---

## Context

`Date#amjd` is not ported. `packages/date/src/date.ts` has no `amjd` member at
all, while its sibling `Date#ajd` landed and `Date#mjd` / `Date#ld` landed in
PR #6312. The three are one family in the C and only this one is missing.

Ruby: `d_lite_amjd` (`vendor/date/ext/date/date_core.c:5231-5236`) over `m_amjd`
(`vendor/date/ext/date/date_core.c:1624-1650`), registered at
`vendor/date/ext/date/date_core.c:9721`.

    $ ruby -rdate -e 'puts Date.new(2001,2,3).amjd'
    51943/1

`m_amjd` is the astronomical modified Julian day: `m_real_jd` less 2400001 as a
Rational, and on the complex arm plus the day fraction and the sub-second, both
as fractions of a day. Unlike `Date#mjd` it is NOT adjusted by the offset — it
reads `m_df`, the stored UTC day fraction, where `mjd` reads the local day. The
C's two spellings of the subtraction (a `long` fast path and an `f_sub` one)
build the same Rational, exactly as the already-ported `Date#ajd` documents for
its own pair.

Every helper it needs is already in the file: `mRealJd`, `mDf`, `mSf`,
`isecToDay`, `nsToDay`, `simpleDatP`.

## Converged shape

`Date#amjd` next to `Date#ajd`, with the `simple_dat_p` branch the C makes,
returning a `Rational`. `DateTime` needs no override — `ajd` already
demonstrates the one-method-two-arms shape.

## Acceptance criteria

- [ ] `new Date(2001, 2, 3).amjd` is `Rational(51943, 1)`.
- [ ] The offset arm matches MRI, which is the point of the reader:
      `DateTime.new(2001,2,3,4,5,6,'+7').amjd` and
      `DateTime.new(2001,2,2,14,5,6,'-7').amjd` are both `(249325817/4800)`
      (the C's own doc example, `date_core.c:5224-5228`).
- [ ] Covered in `packages/date/src/date.trails.test.ts` until
      `test_switch_hitter.rb` / `test_date.rb` claim it.
- [ ] `pnpm parity:test --package date` does not regress.
