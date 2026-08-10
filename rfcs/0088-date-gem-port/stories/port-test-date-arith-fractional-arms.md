---
title: "port-test-date-arith-fractional-arms"
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
closed-reason: "Superseded: every item is now ported. #6312 landed d_lite_plus's T_FLOAT arm (date_core.c:6060-6135) and Date#dNewInternal (:3055-3071), which gives a Date the ComplexDateData slot this story was filed to decide on; PR #6313 ported DateTime#new_offset (d_lite_new_offset :5920-5934) with offset_to_sec's default arm (:2398-2405) and test_new_offset with it. test_date_arith.rb is 11/23 credited, the whole of lines 10-152."
---

## Context

Split out of `port-test-date-arith-operators` (PR #6313), which ported
`test_date_arith.rb` lines 10-152 except `test_new_offset`, and with it
`d_lite_plus`'s `T_FIXNUM` / `T_BIGNUM` / `T_RATIONAL` arms, `minus_dd`, the
`prev_*` family, `m_of`, `d_lite_mday` and the
`dSimpleNewInternal`/`dComplexNewInternal` return seam. Three things it left:

1. **`DateTime#new_offset`** — `d_lite_new_offset` over `val2off` /
   `offset_to_sec` (`vendor/date/ext/date/date_core.c:2369-2452`,
   `:5071-5077`), including the `TypeError` arm a `Numeric` whose `to_r`
   answers itself lands in. `test_new_offset`
   (`vendor/date/test/date/test_date_arith.rb:10`) is the test, and it is the
   only test of that file's first half still missing.
2. **`d_lite_plus`'s `T_FLOAT` arm** (`date_core.c:6060-6135`), which rounds
   the fraction to nanoseconds where the ported `T_RATIONAL` arm keeps it
   exact. `Date#plus` raises `RangeError("Date#+ of a Float is not ported
yet")` for a non-integer `number` today; that raise is what this deletes.
   Note `DateTime`'s constructor already inlines the arm's rounding via
   `add_frac` (`date_core.c:3313-3317`), so the two must agree.
3. **A `Date` carrying `ComplexDateData`.** `Date#dComplexNewInternal` raises:
   MRI answers a `Date` with a day-fraction for `Date.new(2000,1,1) +
Rational(1,2)`, and this port keeps `df`/`sf`/`of` on `DateTime` alone. The
   `T_RATIONAL` arm reaches it only for a `Date` receiver.

Adjacent and cheap while in the file: `cmp_gen`'s `rb_num_coerce_cmp` tail
(`date_core.c:6694-6705`) is ported, but `Date#compare`'s numeric arm relies on
`m_ajd`, which landed with #6307 — check whether anything is still missing there.

## Acceptance criteria

- [ ] `test_new_offset` is ported into `packages/date/src/test-date-arith.test.ts`
      under its Ruby name, and `pnpm parity:test --package date` credits it.
- [ ] `Date#plus` accepts a `Float`-shaped `number`; the `RangeError` for it is
      deleted.
- [ ] `Date#dComplexNewInternal` answers a value instead of raising, or the
      story records why the `Date`/`DateTime` field split makes that the wrong
      call and converges the raise into something a caller can act on.
- [ ] No Temporal return is converged back to a Ruby-shaped one to silence an
      assertion-value mismatch (`vendor/sources.ts:212-221`).
