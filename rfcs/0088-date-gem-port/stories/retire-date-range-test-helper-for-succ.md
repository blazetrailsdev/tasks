---
title: "Retire test-date-strftime's dateRange helper once Date#succ lands"
status: done
updated: 2026-08-18
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: ["port-test-date-arith-iteration"]
deps-rfc: []
est-loc: 30
priority: null
pr: 6714
claim: "2026-08-18T19:32:44Z"
assignee: "converge-includes-preload-colon-sweep-src-top-level"
blocked-by: null
closed-reason: null
---

## Context

`packages/date/src/test-date-strftime.test.ts` carries a module-private
`dateRange` generator standing in for Ruby's
`(Date.new(1970,1,1)..Date.new(2037,12,31)).each`, which
`test_strftime__3_1` / `test_strftime__3_2` walk
(`vendor/date/test/date/test_date_strftime.rb:118-136`).

Ruby's `Range#each` walks by `Date#succ` — `d_lite_next_day`, which is
`d_lite_plus(self, 1)`. PR #6311 landed the helper because neither `#+` nor
`#succ` existed; a later rebase converged it onto the `Date#plus` that had
landed meanwhile, so it now reads:

```ts
function* dateRange(from: RubyDate, to: RubyDate): Generator<RubyDate> {
  for (let d = from; d.cmp(to)! <= 0; d = d.plus(1)) {
    yield d;
  }
}
```

That is the right _shape_ but still a trails-only helper: two ported tests walk
a range through something Ruby spells `Range#each`. `#succ` / `#next` land in
`port-test-date-arith-iteration` (`test_next`, `test_next_day`), which is the
dependency here — this story is only the test-side retirement, not the port of
`#succ`.

## Acceptance criteria

- [ ] `dateRange` is deleted from `test-date-strftime.test.ts` and the two tests
      walk the range the way Ruby does — through `Date#succ` directly, or through
      whatever `Range`/`upto` surface `port-test-date-arith-iteration` lands
      (`Date#upto` is `test_upto` in that story and is the closest analogue to
      `Range#each`).
- [ ] `test_strftime__3_1` and `test_strftime__3_2` still pass and still walk the
      full 1970-01-01..2037-12-31 range — 24,837 days. Do not shrink the range to
      make it cheap.
- [ ] The two tests keep an explicit vitest `timeout`; they ran ~2.4s and ~3.7s
      after #6311's `Time#strftime` fix, well under the 30s currently set, but
      the default 5s is too close for CI.

## Notes

Small and mechanical once the dependency lands. `est-loc` is the test-file delta
only.
