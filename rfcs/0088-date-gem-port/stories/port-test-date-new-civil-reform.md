---
title: "port-test-date-new-civil-reform"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6323
claim: "2026-08-10T03:06:34Z"
assignee: "port-test-date-new-civil-reform"
blocked-by: null
closed-reason: null
---

## Context

`test_civil__reform` (`vendor/date/test/date/test_date_new.rb:194-214`) is
ported and credited by PR #6315 — `it("civil reform")` in
`packages/date/src/test-date-new.test.ts`, asserting both reform jumps
(1752-09-14 → 1752-09-02, 1582-10-15 → 1582-10-04) for `Date` and `DateTime`,
and spelling `d -= 1` as `minus(1)` now that PR #6313 has landed `Date#-`
(`d_lite_minus`, `vendor/date/ext/date/date_core.c:6343-6360`).

One loose end remains, and it is a documentation defect rather than a test gap.
The test's receiver is `dNewByFrags({ jd: Date.ENGLAND }, Date.ENGLAND)` rather
than Ruby's `Date.jd(...)`, because `Date.jd` answers the `Temporal` seat
(RFC 0088, `vendor/sources.ts:212-221`). That is sound —
`d_new_by_frags` (`date_core.c:4283`) and `date_s_jd` (`:3377-3387`) both end at
`d_simple_new_internal` (`:3036`), and the test asserts the two agree — but
`Date#toDate`'s JSDoc advertises a different inverse: "a caller who wants the
gem-shaped object back hands the Temporal value to the constructor
({@link Date}'s `PlainDate` overload)". **`Date` declares no such overload.**
Its constructor overloads are `(year?, month?, day?, start?)` and the `SEAT`
one; passing a `Temporal.PlainDate` now raises `TypeError: invalid year (not
numeric)` from `check_numeric` (`date_core.c:67-72`).

So the JSDoc names a seam that does not exist, and the seam that does exist
(`dNewByFrags` / `dtNewByFrags`, which the same JSDoc mentions second) is the
only route.

## Acceptance criteria

- [ ] Decide which way to close the gap: either declare the
      `Temporal.PlainDate` constructor overload `toDate()`'s JSDoc promises —
      the `d_simple_new_internal` seat behind it already exists — or correct the
      JSDoc to name `dNewByFrags` / `dtNewByFrags` as the sole inverse seat.
- [ ] If the overload lands, `it("civil reform")` in
      `packages/date/src/test-date-new.test.ts` moves its receiver back to
      `Date.jd(...)` fed through it, which is Ruby's own call.
- [ ] `pnpm parity:test --package date` still credits `civil reform`; the
      `test_date_new.rb` row stays at 12 OK / 0 Skip / 0 Desc.
