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

`test_civil__reform` (`vendor/date/test/date/test_date_new.rb:194-214`) **is
ported and credited** as of PR #6315 — `it("civil reform")` in
`packages/date/src/test-date-new.test.ts`, asserting both reform jumps
(1752-09-14 → 1752-09-02 and 1582-10-15 → 1582-10-04).

What remains is one spelling. Ruby's `d -= 1` is written there as `plus(-1)`,
which is not an approximation: `d_lite_minus`'s Fixnum arm IS
`d_lite_plus(self, LONG2NUM(-FIX2LONG(other)))`
(`vendor/date/ext/date/date_core.c:6350-6352`). `Date#-` itself
(`d_lite_minus`, `:6343-6360`) is ported by PR #6313, which was still open when
PR #6315 shipped, so duplicating it there would have collided in the same file.

The receiver is `dNewByFrags({ jd: Date.ENGLAND }, Date.ENGLAND)` rather than
Ruby's `Date.jd(...)`, because `Date.jd` answers the `Temporal` seat (RFC 0088,
`vendor/sources.ts:212-221`). `d_new_by_frags` (`date_core.c:4283`) and
`date_s_jd` (`:3377-3387`) both end at `d_simple_new_internal` (`:3036`), and
the test asserts the two agree. `toDate()`'s JSDoc names this as the sanctioned
route — but it also names a `Temporal` constructor overload on `Date` that the
class does not actually declare, which is worth reconciling.

## Acceptance criteria

- [ ] After #6313 merges, `plus(-1)` in `it("civil reform")` becomes `minus(1)`,
      matching Ruby's `d -= 1`; the explanatory comment shrinks to the receiver
      note.
- [ ] Either declare the `Temporal.PlainDate` constructor overload `toDate()`'s
      JSDoc promises, or correct that JSDoc to name `dNewByFrags` /
      `dtNewByFrags` as the only inverse seat.
- [ ] `pnpm test:compare --package date` still credits `civil reform`; the
      `test_date_new.rb` row stays at 11 OK / 0 Skip / 0 Desc.
