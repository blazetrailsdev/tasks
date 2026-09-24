---
title: "duration-sum-guard-is-an-instanceof-list-not-acts-like"
status: ready
updated: 2026-09-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Duration#sum`'s receiver guard is an `instanceof` list where Rails asks two
`acts_like?` questions.

Rails (`vendor/rails/activesupport/lib/active_support/duration.rb:486-489`):

```ruby
def sum(sign, time = ::Time.current)
  unless time.acts_like?(:time) || time.acts_like?(:date)
    raise ::ArgumentError, "expected a time or date, got #{time.inspect}"
  end
```

trails (`packages/activesupport/src/duration.ts:424-437`):

```ts
if (
  !(
    time instanceof Date ||
    time instanceof Temporal.Instant ||
    time instanceof Temporal.PlainDate ||
    time instanceof RubyTime ||
    isDateTime(time) ||
    (time != null && time.actsLikeTime?.() === true)
  )
) {
```

Converging it to `actsLikeTime(time) || actsLikeDate(time)` was **tried and
reverted** during trails#7903: those two helpers
(`packages/date/src/acts-like.ts`) answer only for `Date`, `Temporal.Instant`,
`PlainDate`, `PlainDateTime` and `ZonedDateTime`. `RubyTime`
(`packages/date/src/time.ts:1452`) and `TimeWithZone`
(`packages/activesupport/src/time-with-zone.ts:847`) carry their own
`actsLikeTime()` **method** instead and are matched by neither helper, so the
converged form rejected every `Time` and `TimeWithZone` receiver and reddened
73 tests across `duration.test.ts`, `duration.trails.test.ts` and
`time-travel.test.ts`.

The real gap is that `acts_like?` has two disjoint spellings in trails — a free
predicate for the Temporal types and an instance method for the Ruby-shaped
ones — with nothing that asks the Ruby question of an arbitrary receiver. Until
one exists, the `instanceof` list is the only form that covers both families,
and `isDateTime` was added to it in trails#7903 rather than converging the
shape.

## Acceptance criteria

- [ ] `acts_like?(:time)` / `acts_like?(:date)` have a single spelling that
      answers for both the Temporal types and the Ruby-shaped ones
      (`RubyTime`, `TimeWithZone`).
- [ ] `Duration#sum`'s guard is that pair, mirroring `duration.rb:487`, with no
      `instanceof` list.
- [ ] `duration.test.ts`, `duration.trails.test.ts`, `time-travel.test.ts` and
      `core-ext/numeric-ext.test.ts` stay green.
