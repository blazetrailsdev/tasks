---
title: "Port d_lite_initialize_copy under its Ruby name; stop routing Date#dup through newStart"
status: done
updated: 2026-08-11
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6372
claim: "2026-08-11T18:05:53Z"
assignee: "burndown-annotate-verified-equivalents"
blocked-by: null
closed-reason: null
---

## Context

PR #6341 added `Date#dup` (`packages/date/src/date.ts`, just after `Date#start`)
so `test_dup` (`vendor/date/test/date/test_switch_hitter.rb:611-623`) could be
ported. It is implemented as `this.newStart(this.start)` — reusing the seam that
stands in for the C's file-static `dup_obj_with_new_start`
(`date_core.c:5801-5810`).

That is observably correct (`DateTime#newStart` is overridden and carries
day-fraction, sub-second and offset, so `DateTime#dup` keeps them; MRI agrees:
`DateTime.new(2001,2,3,4,5,6,"+09:00").dup` answers offset `(3/8)` and hour `4`,
and ours does too), but it is NOT the method the C defines. Ruby has no
`Date#dup` of its own: `Object#dup` allocates and calls the `initialize_copy`
the extension registers at `date_core.c:9714`, whose body is
`d_lite_initialize_copy` (`date_core.c:5140-5182`). That body has structure the
`newStart` route does not express — three arms over `simple_dat_p(bdat)` /
`simple_dat_p(adat)` / `complex_dat_p(adat)`, an `rb_check_frozen(copy)` guard,
a `copy == date` early return, and an
`ArgumentError("cannot load complex into simple")` raise (`:5173-5175`) that the
port cannot currently produce at all.

The `newStart` route also goes through `set_sg`, which forces `get_c_jd` /
`get_c_df` and clears the civil seat — work `initialize_copy`'s straight field
copy does not do. No current test sees the difference.

## Converged shape

Port `d_lite_initialize_copy` under its Ruby name (`initializeCopy`), with its
arms, its frozen/self guards and its `ArgumentError` message, and make `dup()`
allocate-and-`initializeCopy` rather than route through `newStart`. Whether
`dup` survives as a named member at all is part of the story: it is `Object#dup`,
not a date_core method, and `parity:api` does not score this package
(`compareApi: false`, `vendor/sources.ts:208`), so the only consumer is
`test-switch-hitter.test.ts`'s `test_dup`.

## Acceptance criteria

- [ ] `initializeCopy` exists at the Ruby name with the C's branch structure
      (`date_core.c:5140-5182`), including the `copy == date` early return and
      the `"cannot load complex into simple"` `ArgumentError`.
- [ ] `dup()` no longer routes through `newStart`/`set_sg`.
- [ ] `test_dup` in `packages/date/src/test-switch-hitter.test.ts` still passes
      unchanged, and `parity:test --package date` does not regress from
      124/137 (`test_switch_hitter.rb` 18/18).
