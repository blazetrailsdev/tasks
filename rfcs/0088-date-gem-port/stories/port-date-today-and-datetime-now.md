---
title: "port-date-today-and-datetime-now"
status: ready
updated: 2026-08-13
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

`Date.today` (`vendor/date/ext/date/date_core.c:3789-3826`, `date_s_today`) and
`DateTime.now` (`date_core.c:8134-8228`, `datetime_s_now`) are not implemented in
`packages/date/src/date.ts`. Both read the system clock through `localtime_r`,
decode `tm_year`/`tm_mon`/`tm_mday` (and for `now` the time of day, the
`tm_gmtoff` offset and the `tv_nsec` sub-second), and hand the pieces to
`d_simple_new_internal` / `d_complex_new_internal` under `GREGORIAN`.
`datetime_s_now` also clamps a leap `s == 60` down to `59` and warns-and-zeroes
an offset outside `±DAY_IN_SECONDS`.

Surfaced porting `test_date_arith.rb`'s `test_next`
(`vendor/date/test/date/test_date_arith.rb:153-172`, ported in
`packages/date/src/test-date-arith.test.ts` as `it("next")`): its second half is
`Date.today.next` / `DateTime.now.succ` compared back through `- 1`. That half is
left out with a comment naming this story.

Note the shape question the port has to answer: RFC 0088's construction statics
(`Date.jd`, `Date.civil`, `Date.ordinal`, `Date.commercial`, `Date.parse`) all
answer a `Temporal.PlainDate`, which carries no `next`/`succ`, so `Date.today`
returning one cannot satisfy `test_next` as written. Decide the return shape
first — `test_next` is the acceptance test for that decision.

## Acceptance criteria

- [ ] `Date.today(start = ITALY)` per `date_core.c:3789-3826`.
- [ ] `DateTime.now(start = ITALY)` per `date_core.c:8134-8228`, including the
      `s == 60` clamp and the out-of-range-offset zeroing.
- [ ] `it("next")` in `packages/date/src/test-date-arith.test.ts` carries the
      `Date.today` / `DateTime.now` arms and the placeholder comment is gone.
- [ ] No `node:*` import and no `process.*` for the clock or the zone.
