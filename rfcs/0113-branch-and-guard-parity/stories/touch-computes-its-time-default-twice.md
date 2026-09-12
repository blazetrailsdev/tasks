---
title: "touch computes the time default that Rails computes only in _touch_row"
status: draft
updated: 2026-09-12
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`touch` computes the `time` default itself, and `_touchRow` computes it again. Rails computes it
in exactly one place — `_touch_row`.

`activerecord/lib/active_record/persistence.rb:793-811`'s `touch` never touches `time`: it
builds `attribute_names` and hands `time` straight through, nil included.

```ruby
def touch(*names, time: nil)
  ...
  unless attribute_names.empty?
    affected_rows = _touch_row(attribute_names, time)
```

`activerecord/lib/active_record/persistence.rb:874-882`'s `_touch_row` is where the default
lives, on its own line:

```ruby
def _touch_row(attribute_names, time)
  time ||= current_time_from_proper_timezone
```

trails has it in both. `packages/activerecord/src/persistence.ts` `touch` resolves a local `now`
before building the names and passes `now` to `_touchRow`, so `_touchRow`'s own
`time ?? currentTimeFromProperTimezone()` is unreachable from `touch` and only fires for other
callers of the chain.

That matters beyond tidiness: the default is evaluated **earlier** than Rails evaluates it — in
trails before `verifyReadonlyAttribute` runs over every attribute name, in Rails after. Any
`ActiveRecordError` raised by that loop therefore happens, in Rails, without
`current_time_from_proper_timezone` having been called at all. It also puts the one line that
decides "now" two methods away from the write that uses it.

Surfaced by trails#7730, which moved `touch` from `timestamp.ts` into `persistence.ts` — next to
the `_touchRow` that already had the default — and rebuilt the `_touch_row` chain under it.

Note `touch-time-option-drops-js-date` (closed, not Rails-convergent) already adjudicated the
_other_ half of this expression: `TouchOptions.time` accepting a JS `Date` and converting at the
boundary is an accepted extra input type, not a divergence. This story is only about where the
nil-default is computed, and must keep that coercion working.

## Converged shape

- `touch` passes `parseTouchArgs(args).time` through to `_touchRow` unchanged — `undefined`,
  `null`, `Date` and `RubyTime` all forwarded as-is, with no local `now`.
- `_touchRow` keeps `const t = time ?? currentTimeFromProperTimezone()` as its first statement,
  and gains the `Date` → `RubyTime` coercion the expression in `touch` is carrying today (the
  `RubyTime.at(new Rational(t.getTime(), 1000))` arm), so the accepted-input behaviour is
  preserved at the single point that now owns it.
- `touch`'s body then reads as `persistence.rb:793-811` line for line.

## Acceptance criteria

- `packages/activerecord/src/persistence.ts` computes the touch time in `_touchRow` only;
  `touch` contains no `currentTimeFromProperTimezone` call and no `now` local.
- `pnpm parity:api:calls` stays green — `touch` loses a `current_time_from_proper_timezone` call
  it should not have been making, so check whether that produces a STALE baseline row to delete.
- `timestamp.test.ts`, `touch-later.test.ts`, `locking.test.ts`, `dirty.trails.test.ts` and
  `counter-cache.test.ts` stay green, including the tests that pass a raw JS `Date` as
  `time:`.
