---
title: "port-test-date-new-civil-reform"
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

`vendor/date/test/date/test_date_new.rb:194-214` (`test_civil__reform`) is the
one test in the 7-214 range that PR for
`port-test-date-new-jd-ordinal-civil` could not port. Its first half —
`Date.jd(Date::ENGLAND, Date::ENGLAND)` and
`DateTime.jd(Date::ENGLAND, 0,0,0,0, Date::ENGLAND)` answering `[1752, 9, 14]`,
and the `Date::ITALY` pair answering `[1582, 10, 15]` — already passes against
`packages/date/src/date.ts` today (verified by hand).

The blocker is the second half: `d -= 1` / `dt -= 1`, which must land on the
pre-reform day (`[1752, 9, 2]` and `[1582, 10, 4]`), the whole point of the
test. `Date#-` (`d_lite_minus`, `vendor/date/ext/date/date_core.c`) is not
ported — `packages/date/src/date.ts` has no `+`/`-` on `Date`/`DateTime` at all,
and the builders answer `Temporal`, whose own `subtract({ days: 1 })` walks the
proleptic ISO calendar and so returns 1752-09-13, not the reform's 1752-09-02.

Substituting `Date.jd(Date::ENGLAND - 1, Date::ENGLAND)` for the `-= 1` would
make the test pass while testing something the Ruby does not, so it was left
out rather than adjusted.

## Acceptance criteria

- [ ] `test_civil__reform` is ported into
      `packages/date/src/test-date-new.test.ts` as `it("civil reform")`, under
      its Ruby name and against a real `Date#-` (`d_lite_minus`), not a
      re-derived `jd`.
- [ ] `pnpm test:compare --package date` credits it; the `test_date_new.rb` row
      moves from 10 to 11 OK with 0 Desc.
- [ ] Blocked on the `Date#+` / `Date#-` port (see
      `port-test-date-arith-operators`); claim after that lands.
