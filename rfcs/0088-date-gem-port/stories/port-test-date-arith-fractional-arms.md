---
title: "port-test-date-arith-fractional-arms"
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

Split out of `port-test-date-arith-operators`, which shipped the integer half of
`test_date_arith.rb` (PR: see `Closes-story` trailer) — 7 of the file's 23 tests
— and stopped at the LOC ceiling. What it ported:

- `packages/date/src/date.ts`: `Date#mJd`/`mDf`/`mSf`/`mOf` (the C's `m_*`
  readers, overridden on `DateTime`), `canonicalizeJd`, `expectNumeric`,
  `Date#plus` (the `T_FIXNUM`/`T_BIGNUM` arms of `d_lite_plus`,
  `date_core.c:5953-6052`), `DateTime#plus` (the `d_complex_new_internal`
  return, `:5989-6003`), `Date#minus` + `minusDd` (`:6272-6360`),
  `Date#prevDay`, `Date#rshift`/`lshift` (`:6441-6512`), `Date#prevMonth`,
  `Date#prevYear`, `Date#compare` + `cmpDd` (`:6707-6846`), `Date#mday`.
- `packages/date/src/test-date-arith.test.ts`: `plus ex`, `minus ex`, `compare`,
  `prev`, `prev month`, `prev month 2`, `prev year`.

What is left, and why it did not fit:

1. **`d_lite_plus`'s `T_FLOAT` arm** (`vendor/date/ext/date/date_core.c:6060-6135`)
   and **`T_RATIONAL` arm** (`:6174-6229`). Both split the fraction into
   `jd`/`df`/`sf` and return a `ComplexDateData`. `Date#plus` currently raises
   `RangeError("Date#+ of a fractional argument is not ported yet")` for a
   non-integer argument rather than rounding to a whole day — that raise is
   what this story deletes. Note `DateTime`'s constructor already inlines the
   `T_FLOAT` arm's rounding via `add_frac` (`date_core.c:3313-3317`), so the
   two must end up agreeing.
2. **`dt_lite_new_offset`** (`date_core.c` `d_lite_new_offset`) — `DateTime#new_offset`,
   with its `val2off` / `offset_to_sec` (`:2369-2452`) `TypeError` arm.
3. **`cmp_gen`'s numeric arm** (`:6697-6705`), which reads `m_ajd` — unported;
   `Date#compare` is typed `(other: Date)` until it exists.

## Acceptance criteria

- [ ] The remaining 4 tests of `test_date_arith.rb`'s first half are ported into
      `packages/date/src/test-date-arith.test.ts` under their Ruby names:
      `test_new_offset`, `test__plus`, `test__minus`, `test_prev_day`.
- [ ] `Date#plus` no longer raises for a `Float` or `Rational` argument; the
      `RangeError` and its comment are deleted.
- [ ] `pnpm test:compare --package date` credits them (the file reads 7/23
      today) and no other package regresses.
- [ ] Assertion-value mismatches against Temporal returns are expected and
      benign (`vendor/sources.ts:212-221`) — do not converge a Temporal return
      back to a Ruby-shaped one.
