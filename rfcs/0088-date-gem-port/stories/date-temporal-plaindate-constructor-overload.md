---
title: "Declare the Temporal.PlainDate constructor overload Date#toDate names as its inverse"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6331
claim: "2026-08-10T12:06:36Z"
assignee: "converge-time-to-date-onto-d-simple-new-internal"
blocked-by: null
closed-reason: null
---

## Context

`Date#toDate` (`packages/date/src/date.ts`) answers the Temporal seat; the
gem-shaped object is reachable only through the exported `dNewByFrags` /
`dtNewByFrags`. PR #6323 corrected the `toDate` JSDoc, which had advertised a
`Temporal.PlainDate` constructor overload that **does not exist** — `Date`'s
constructor declares `(year?, month?, day?, start?)` (`date.ts:4747`) and the
`SEAT` form (`:4756`), and passing a `PlainDate` raises
`TypeError: invalid year (not numeric)` from `check_numeric`
(`vendor/date/ext/date/date_core.c:67-72`).

The story `port-test-date-new-civil-reform` offered two ways to close that gap;
PR #6323 took the documentation arm because the overload is materially larger.
This is the other arm, left open deliberately.

## Converged shape

Declare the `Temporal.PlainDate` constructor overload on `Date` (and the
`Temporal.PlainDateTime` / `ZonedDateTime` one on `DateTime`), routing to the
existing `d_simple_new_internal` seat (`date_core.c:3036-3050`) that
`dNewByFrags` and `date_s_jd` (`:3377-3387`) both already end at — the seat
exists, only the entry point is missing. The overload is the documented inverse
of `to_date` / `to_datetime` (`date_core.c:8992-9027`), so it is not invented
surface, but confirm against `pnpm parity:api:extra --package date`.

With it landed, `it("civil reform")` in `packages/date/src/test-date-new.test.ts`
(PR #6315) moves its receiver from `dNewByFrags({ jd: Date.ENGLAND }, ...)` back
to `Date.jd(...)` fed through the overload, which is Ruby's own call
(`vendor/date/test/date/test_date_new.rb:194-214`).

## Acceptance criteria

- [ ] `new Date(plainDate)` / `new DateTime(plainDateTime)` build the gem-shaped
      object through `d_simple_new_internal`, no new seat.
- [ ] `Date#toDate`'s JSDoc names the overload as an inverse again — the
      paragraph #6323 rewrote to name `dNewByFrags` as the _sole_ seat is
      updated, since it would no longer be true.
- [ ] `it("civil reform")` uses `Date.jd(...)`; the test name is unchanged.
- [ ] `pnpm parity:test --package date` still credits `civil reform`; the
      `test_date_new.rb` row stays at 12 OK / 0 Skip / 0 Desc.
