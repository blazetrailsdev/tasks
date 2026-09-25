---
title: "Time#next_weekday / #prev_weekday answer an Instant on the weekend branch"
status: done
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8070
claim: "2026-09-25T00:24:15Z"
assignee: "time-weekday-helpers-return-instant-not-time"
blocked-by: null
closed-reason: null
---

## Context

`Time#next_weekday` and `Time#prev_weekday` always answer a Time in Ruby:
`DateAndTime::Calculations#next_weekday`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb:209-215`)
is `if next_day.on_weekend? then next_week(:monday, same_time: true) else next_day end`,
and both arms are ordinary calls on `self`, so the receiver's class comes back out.
`prev_weekday` (`:236-242`) is the mirror.

trails ports the module as free functions over two receiver representations — a
JS `Date` for the Time arm, `Temporal.PlainDate`/`RubyDate` for the Date arm —
and `packages/activesupport/src/core-ext/date-and-time/calculations.ts`'s
`nextWeekday` / `prevWeekday` mix the two in one body. Since trails#7827 mixed
the module onto `RubyTime.prototype`, those members are reachable on a `Time`,
and the two arms disagree:

````text
2000-06-15 (Thu)  time.nextWeekday() -> Time
2000-06-16 (Fri)  time.nextWeekday() -> Temporal.Instant
2000-06-17 (Sat)  time.nextWeekday() -> Temporal.Instant
```text

The weekday branch goes through the private `nextDay` -> `advance`, whose
`RubyTime` arm returns the receiver's own `Time#advance`
(`core_ext/time/calculations.rb:194`). The weekend branch goes through
`nextWeek` / `beginningOfWeek`, which are built on the JS-`Date` Time arm and
return a `Temporal.Instant`. Ruby has one representation and therefore cannot
have this split.

Deliberately NOT covered by trails#7827's `RubyTime -> RubyTime` overloads: those
were added only to the twelve `advance`-routed exports, which really do answer a
`Time`, so nothing is currently mis-declared — `nextWeekday` / `prevWeekday`
still declare only the `PlainDate` / `Date` arms and the wart is undeclared
rather than wrong. Before trails#7827 these members were simply absent from
`Time`.

## Converged shape

`nextWeek` / `prevWeek` / `beginningOfWeek` / `endOfWeek` preserve the
receiver's representation, so every arm of `nextWeekday` / `prevWeekday` answers
what the receiver is — a `Time` in, a `Time` out — the way Ruby's `self`-calls
do. Related: [[converge-date-and-time-calculations-to-this-typed-mixin]], which
removes the leading receiver parameter; this-typing alone does not fix the week
helpers, because they are built on the JS-`Date` arm regardless of how the
receiver is passed.

## Acceptance criteria

- `time.nextWeekday()` and `time.prevWeekday()` answer a `Time` on BOTH the
  weekday and the weekend branch, for a `Time` receiver.
- A test pins all three of the dates above (Thu / Fri / Sat) so the branch split
  cannot come back; it fails on today's baseline.
- The `Date` / `PlainDate` arms are unchanged.
- `nextWeekday` / `prevWeekday` gain the `RubyTime -> RubyTime` overload that the
  twelve `advance`-routed exports already carry.
- `pnpm parity:api` and `pnpm parity:test` deltas non-negative;
  `pnpm parity:api:calls` and `pnpm parity:api:calls:args` gain no row.
````
