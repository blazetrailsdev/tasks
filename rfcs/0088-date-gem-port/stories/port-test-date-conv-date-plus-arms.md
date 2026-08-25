---
title: "port-test-date-conv-date-plus-arms"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6322
claim: "2026-08-10T02:46:35Z"
assignee: "port-test-date-conv-date-plus-arms"
blocked-by: null
closed-reason: null
---

## Context

`port-test-date-conv` shipped 7 of `vendor/date/test/date/test_date_conv.rb`'s
12 tests into `packages/date/src/test-date-conv.test.ts`, together with the
conversion cluster they needed: `Date#toTime` (`date_core.c:8949-8971`),
`Date#toDatetime` (`date_core.c:8992-9027`), `DateTime#toTime`
(`date_core.c:9032-9062`), and `Time#toTime` / `Time#toDate` /
`Time#toDatetime` (`date_core.c:8860-8935`) plus `Time.mktime` and `Time.utc`'s
`usec` positional.

The remaining 5 are blocked on `Date#+` — `d_lite_plus`
(`vendor/date/ext/date/date_core.c:4967`) — which is unported, and on
`Date#day_fraction` (`d_lite_day_fraction`, over `m_df`), which is what the
`to_date` arms of those tests assert on. Every one of the 5 builds its subject
as `Date.new(2004, 9, 19) + 1.to_r/2` or
`DateTime.new(...) + 456789.to_r/86400000000`, so none of them can be written
at all today:

- `test_to_time__from_datetime` (`test_date_conv.rb:68-96`)
- `test_to_date__from_date` (`:112-117`)
- `test_to_date__from_datetime` (`:119-127`)
- `test_to_datetime__from_date` (`:157-163`)
- `test_to_datetime__from_datetime` (`:165-183`)

Note `test_to_time__from_datetime`'s last two blocks are guarded on
`Time#nsec` / `Time#subsec` responding; trails' `Time` has both, so they port.

## Acceptance criteria

- [ ] `Date#plus` ported against `d_lite_plus` (`date_core.c:5952-6270`) — all
      four operand arms (`T_FIXNUM`, `T_BIGNUM`, `T_FLOAT`, `T_RATIONAL`), since
      one Rails method is one TS method.
- [ ] **`Date` gains the `ComplexDateData` arm.** `d_lite_plus`'s `T_RATIONAL`
      arm ends in `d_complex_new_internal(rb_obj_class(self), nth, jd, df, sf,
...)` (`date_core.c:6249-6259`), and `rb_obj_class(self)` is `Date` — so
      `Date.new(2004, 9, 19) + 1.to_r/2` is a `Date` CARRYING a day fraction,
      which is exactly what `test_to_date__from_date` and
      `test_to_datetime__from_date` assert on. trails' `Date` is simple-only by
      construction: `simpleDatP` is `!(dat instanceof DateTime)` and
      `Date#mDf()` / `Date#mSf()` answer `0` / `Rational(0, 1)`
      unconditionally. Shipping `plus` without this silently drops the
      fraction — a wrong-value regression, not a gap. This is the real blocker;
      the other three tests need only `DateTime#+`, which the existing complex
      storage can already represent.
- [ ] `Date#dayFraction` ported against `d_lite_day_fraction` over `m_df`.
- [ ] The 5 tests above land in `packages/date/src/test-date-conv.test.ts`
      under their Ruby names (underscores become spaces — that is what
      `parity:test` matches on, see the 7 already there), taking the file to
      12/12 and `2/10` files to `3/10`.
- [ ] Assertion-_value_ mismatches against these tests are expected and benign
      (`vendor/sources.ts:212-221`): RFC 0088 returns `Temporal` where Ruby
      returns `Date`/`DateTime`/`Time`. Do not converge a Temporal return back.
