---
title: "Date's builder seats answer Date, not rb_obj_class(self)"
status: done
updated: 2026-08-17
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6624
claim: "2026-08-17T01:02:54Z"
assignee: "port-hwia-bang-forms-and-to-options"
blocked-by: null
closed-reason: null
---

## Context

`Date`'s copy/builder seats name `Date` / `DateTime` outright where MRI builds
through `rb_obj_class(self)`, so a subclass instance answers a base-class
instance:

- `packages/date/src/date.ts:6717` `newStart()` — `new Date(SEAT, ...) as this`.
  MRI reaches `dup_obj_with_new_start` (`vendor/date/ext/date/date_core.c:5801-5810`),
  which is `d_simple_new_internal(rb_obj_class(obj), ...)`. `italy` / `england`
  / `julian` / `gregorian` (`date_core.c:5848-5888`) all funnel through it.
- `packages/date/src/date.ts:7088` `dNewInternal()` — `new Date(SEAT, ...)`,
  and `DateTime`'s override at `:8503` — `new DateTime(SEAT, ...)`. MRI's
  `d_simple_new_internal` (`date_core.c:3036-3050`) and
  `d_complex_new_internal` (`:3055-3071`) both take `klass` from
  `rb_obj_class(self)` at every `d_lite_plus` call site
  (`date_core.c:5952-6272`), which is what makes `#+`, `#-`, `#>>`, `#<<`,
  `#succ` and `#next` all answer the receiver's class.

The `this` return TYPE is already correct at each of these; only the runtime
class is wrong. Both seats are already documented as the deliberate TS stand-in
for `rb_obj_class`, so this is a small, contained convergence: take the class
off `this.constructor` at `newStart` and at both `dNewInternal` arms, without
disturbing the `Date` vs `DateTime` simple/complex split those seats carry.

The construction STATICS (`Date.today`, `DateTime.now`, `Date.jd`, ...) are a
separate question — they answer the `Temporal` seat under RFC 0088 and so have
no class to propagate; see the note on
`port-test-date-sub-class-propagation`, which is the test that consumes both
halves and stays blocked on the statics.

Surfaced while porting `test_next`'s `Date.today` / `DateTime.now` arms
(PR #6615).

## Acceptance criteria

- [ ] `newStart` and both `dNewInternal` arms build the receiver's class per
      `date_core.c:5801-5810` / `:3036-3071`.
- [ ] A `class DateSub extends Date` instance answers `DateSub` from `plus`,
      `minus`, `rshift`, `lshift`, `succ`, `next`, `italy`, `england`,
      `julian`, `gregorian`; likewise `DateTimeSub` from `DateTime`.
- [ ] `pnpm parity:test --package date` does not regress.
