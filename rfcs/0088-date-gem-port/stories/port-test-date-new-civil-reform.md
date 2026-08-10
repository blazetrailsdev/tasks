---
title: "port-test-date-new-civil-reform"
status: blocked
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
blocked-by: "Blocked on open PR #6313, which ports Date#- (d_lite_minus, date_core.c:6343-6360) in packages/date/src/date.ts; duplicating it in a sibling PR is forbidden. Also needs a public Julian-day-to-Date-instance seat: Date.jd answers a Temporal.PlainDate (RFC 0088, vendor/sources.ts:212-221) and toDate()'s JSDoc names a Temporal constructor overload the class does not declare."
closed-reason: null
---

## Context

`vendor/date/test/date/test_date_new.rb:194-214` (`test_civil__reform`) is the
one test in the 7-214 range PR #6315 (`port-test-date-new-jd-ordinal-civil`)
could not port. It sits in `packages/date/src/test-date-new.test.ts` today as an
`it.skip` carrying this reason.

Its first half — `Date.jd(Date::ENGLAND, Date::ENGLAND)` and
`DateTime.jd(Date::ENGLAND, 0,0,0,0, Date::ENGLAND)` answering `[1752, 9, 14]`,
and the `Date::ITALY` pair answering `[1582, 10, 15]` — already passes today.
The calendar arithmetic is right too: `new Date(1752, 9, 14, Date.ENGLAND).plus(-1)`
answers 1752-09-02, the reform day the test wants.

Two surface gaps block the second half, `d -= 1` / `dt -= 1`:

1. **No receiver.** `Date.jd` / `DateTime.jd` answer a `Temporal.PlainDate` /
   `PlainDateTime` (RFC 0088's headline decision, `vendor/sources.ts:212-221`),
   which has no `-`. `Temporal`'s own `subtract({ days: 1 })` walks the
   proleptic ISO calendar and lands on 1752-09-13, not 1752-09-02. Converging
   the builder back to a Ruby-shaped return is explicitly out of bounds.
2. **`Date#-` is unported.** `d_lite_minus`
   (`vendor/date/ext/date/date_core.c:6344`) has no counterpart in
   `packages/date/src/date.ts`; only `Date#+` (`plus`, `d_lite_plus`,
   `date_core.c:5953`) exists.

Substituting `Date.jd(Date::ENGLAND - 1, Date::ENGLAND)` for the `-= 1` would
make the test pass while testing something the Ruby does not, so it was left
skipped rather than adjusted.

## Acceptance criteria

- [ ] `Date#-` / `DateTime#-` ported as `minus` from `d_lite_minus`
      (`date_core.c:6344`), mirroring the arm split `plus` already has.
- [ ] A decision recorded for how the test reaches a `Date` receiver from
      `Date.jd` without reversing RFC 0088's `Temporal` return.
- [ ] The `it.skip("civil reform")` in `packages/date/src/test-date-new.test.ts`
      becomes a real `it`, under its Ruby name, against that `minus`.
- [ ] `pnpm test:compare --package date` credits it: the `test_date_new.rb` row
      gains one OK and loses one Skip, with 0 Desc.
