---
title: "duration-application-seam-must-accept-a-time-receiver"
status: in-progress
updated: 2026-09-04
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 15
pr: 7493
claim: "2026-09-04T19:50:50Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Duration#since`/`#until` apply the duration to whatever time
value they are handed — `sum(1, time)` /`sum(-1, time)`
(`vendor/rails/activesupport/lib/active_support/duration.rb`), and Ruby's
`Time#plus_with_duration` reaches them with a `::Time` receiver:

```ruby
# vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:296-314
def plus_with_duration(other)
  if ActiveSupport::Duration === other
    other.since(self)
  else
    plus_without_duration(other)
  end
end
```

trails' `Duration#sum` (`packages/activesupport/src/duration.ts:477-499`) accepts
only `Date`, `Temporal.Instant` and `Temporal.PlainDate`, and raises
`ArgumentError("expected a time or date, got …")` for anything else; its
application helper `applyDurationPreservingNs` (`duration.ts:727-735`) is typed
`Date | Temporal.Instant` and bottoms out in `applyDuration`
(`duration.ts:741`), which is JS-`Date` arithmetic and throws a `TypeError` for
a non-`Date`. So `duration.since(rubyTime)` cannot run at all, even though Ruby
applies a Duration to a `::Time` as its most common case.

Surfaced by `time-coercion-operator-methods-onto-time-class` (RFC 0113), which
is BLOCKED on this: its `plus_with_duration`/`minus_with_duration` halves are
`other.since(self)` / `other.until(self)` off a `::Time` receiver and have
nowhere to land. That story's other blocker — `Time#to_f`/`#<=>`/`#eql?`
unported in `@blazetrails/date` — is
[[port-time-to-f-compare-and-eql-onto-date-package-time]].

## Converged shape

`Duration#sum` accepts a `Time` from `@blazetrails/date` alongside the three
shapes it takes today, and applies the parts to it the way Rails does —
sequentially, preserving the receiver's zone and its sub-millisecond precision,
which is what `applyDurationPreservingNs`'s nanosecond remainder already exists
to protect. A `Time` in must answer a `Time` out, as Ruby's does: Rails'
`Duration#since(::Time)` returns a `::Time`, not a normalized instant.

## Acceptance criteria

- `duration.since(time)` / `#until` / `#ago` / `#after` / `#before` accept a
  `@blazetrails/date` `Time` and answer a `Time`, with the receiver's zone and
  nanoseconds intact across a DST boundary (calendar parts on the wall clock,
  seconds on the instant — the same split `Time#advance` uses).
- The `ArgumentError` message and its raise site are unchanged for the shapes
  that genuinely are not a time or date.
- `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green; the activesupport
  duration tests stay green.
- Unblocks the `*_with_duration` half of
  [[time-coercion-operator-methods-onto-time-class]].
