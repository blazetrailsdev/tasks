---
title: "port-test-date-sub-class-propagation"
status: done
updated: 2026-08-18
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6710
claim: "2026-08-18T18:37:42Z"
assignee: "port-test-date-sub-class-propagation"
blocked-by: null
closed-reason: null
---

## Context

`test_sub` (`vendor/date/test/date/test_date.rb:46-107`) is the last of
`test_date.rb`'s 9 tests left unported — PR #6311 landed 5 and this bundle's PR
landed 3 more (`test_range_infinite_float`, `test_hash`,
`test_infinity_comparison`), leaving `test_date.rb` at 8/9.

It declares `class DateSub < Date` / `class DateTimeSub < DateTime` and asserts
that every builder answers the RECEIVER's class: `.today` / `.now`, `#+`, `#-`,
`#>>`, `#<<`, `#succ`, `#next`, `#italy`, `#england`, `#julian`, `#gregorian`,
and `Marshal.dump` / `Marshal.load`.

MRI gets this from `d_lite_plus` and its siblings building through
`rb_obj_class(self)` — `d_simple_new_internal(rb_obj_class(self), ...)`
(`date_core.c:5952-6272` for `#+`, `dup_obj` at `date_core.c:5801-5810` for the
four calendar readers). The port's builders name `Date` outright instead:
`packages/date/src/date.ts` `newStart()` returns `new Date(SEAT, ...) as this`,
and `plus`/`minus`/`rshift`/`lshift` do the same. The `this` return TYPE is
already right; the runtime class is not.

Two blockers, both of them real work:

1. Threading `this.constructor` through every `Date` builder in `date.ts`
   (`newStart`, `plus`, `minus`, `rshift`, `lshift`, `succ`/`next`, and the
   `dNewInternal` seat they share), without breaking the `Date` vs `DateTime`
   split those seats already carry.
2. `Marshal.dump` / `Marshal.load` (`d_lite_marshal_dump`,
   `d_lite_marshal_load`, `date_core.c:8663-8746`), of which the package has
   nothing, and which has no JS counterpart to lean on.

## Acceptance criteria

- [ ] `test_sub` is ported into `packages/date/src/test-date.test.ts` under its
      Ruby name, taking `test_date.rb` to 9/9.
- [ ] `Date`'s builders answer `rb_obj_class(self)` — a subclass instance
      answers the subclass — per the C sites above.
- [ ] `pnpm parity:test --package date` credits it; no other package regresses.
