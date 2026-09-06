---
title: "in_time_zone's no-zone arm normalizes to an Instant where Rails returns self"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 19
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7534, which converged
`TimeZoneConverter#convert_time_to_time_zone` onto `acts_like?(:time)` /
`in_time_zone` and grew `in_time_zone`'s missing arms. The no-zone fallback was
left alone as pre-existing and out of that story's scope; the reviewer flagged
it in the same pass.

Rails' `DateAndTime::Zones#in_time_zone`
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/zones.rb:20-29`):

```ruby
def in_time_zone(zone = ::Time.zone)
  time_zone = ::Time.find_zone! zone
  time = acts_like?(:time) ? self : nil

  if time_zone
    time_with_zone(time, time_zone)
  else
    time || to_time
  end
end
```

`Time.find_zone!(nil)` returns `nil`, so with no zone configured Rails returns
`time` — **self, unconverted**. A `Time` stays a `Time`; a `DateTime` stays a
`DateTime`.

trails' port
(`packages/activesupport/src/core-ext/date-and-time/zones.ts`) instead
normalizes through `asInstant`:

```ts
return time !== null ? asInstant(time) : toTime(dateOrTime as Temporal.PlainDate);
```

So with no zone a `RubyTime` comes back as a `Temporal.Instant` and a JS `Date`
comes back as an `Instant`, where Rails hands back the receiver. `asInstant`
also runs `getutc()` on a non-UTC `RubyTime`, which Rails only does inside
`time_with_zone` (`zones.rb:33-35`), never on this branch.

The observable reach is through
`TimeZoneConverter#convertTimeToTimeZone`
(`packages/activerecord/src/attribute-methods/time-zone-conversion.ts`), whose
`deserialize` path now sends `in_time_zone` for every value
`actsLike(_, "time")` admits: with `Time.zone` unset, a deserialized datetime
attribute is an `Instant` rather than the value the subtype produced.

## Converged shape

The `else` arm returns `time` itself:

```ts
return time !== null ? time : toTime(dateOrTime as Temporal.PlainDate);
```

with the overload return types widened to carry the receiver's own type
(`Date`, `RubyTime`, `Temporal.PlainDateTime`, `Temporal.ZonedDateTime`) rather
than collapsing to `Temporal.Instant`. `asInstant` then survives only where
Rails calls it — inside `timeWithZone`, which is `zones.rb:33-35`'s
`TimeWithZone.new(time.utc? ? time : time.getutc, zone)`.

Check the callers of `inTimeZone` that assume an `Instant` on the no-zone path
before flipping it; `time-with-zone.ts:595` (`timeAdvance`) is the one inside
activesupport itself, and it always passes an explicit zone, so it is unaffected.

## Acceptance criteria

- [ ] The no-zone branch returns the receiver, matching `zones.rb:28`'s
      `time || to_time`.
- [ ] `getutc()` runs only on the `time_with_zone` path (`zones.rb:33-35`).
- [ ] The overloads no longer claim `Temporal.Instant` for a `RubyTime` /
      `Date` receiver.
- [ ] No test renames; AR time-zone lanes green on all three adapters.
