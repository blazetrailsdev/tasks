---
title: "user_input_in_time_zone takes one argument in Rails and reads Time.zone, not a zone parameter"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6180
claim: "2026-08-07T16:29:49Z"
assignee: "of-kind-default-type-and-normalize-arguments"
blocked-by: null
closed-reason: null
---

## Context

`Helpers::TimeValue#user_input_in_time_zone` takes one argument and reads the
zone off the thread-local `Time.zone`
(`activemodel/lib/active_model/type/helpers/time_value.rb:42-44`):

```ruby
def user_input_in_time_zone(value)
  value.in_time_zone
end
```

`Type::Time#user_input_in_time_zone` (`time.rb:47-63`) likewise takes one
argument and ends in `super(value)`.

The port threads an extra `zone` parameter with a `"UTC"` default:

- `packages/activemodel/src/type/time.ts` — `userInputInTimeZone(value: unknown, zone: string = "UTC")`
- `packages/activemodel/src/type/helpers/time-value.ts` — same signature on the
  standalone helper

That is invented arity: no Rails caller passes a zone, and the default silently
substitutes UTC where Ruby would have read `Time.zone`. A caller that forgets the
argument gets UTC rather than the configured zone — the failure is silent and
gives a wrong instant, not an error.

ActiveSupport already carries the zone state this needs: `getZone()` /
`getZoneDefault()` (`packages/activesupport/src/time-zone-config.ts`), which
`packages/activerecord/src/attribute-methods/time-zone-conversion.ts` reads
directly. `Helpers::Timezone#is_utc?` is already ported over `getZoneDefault()`
in `packages/activemodel/src/type/helpers/timezone.ts`, so the precedent for
reaching that state from activemodel exists in the same directory.

Surfaced in PR #6154 while porting `Type::Time#user_input_in_time_zone` — the
body converged, the signature did not.

## Converged shape

`userInputInTimeZone(value)` — one parameter, matching `time_value.rb:42` and
`time.rb:47`. The zone comes from ActiveSupport's `Time.zone` analogue
(`getZone()`, falling back as `in_time_zone` does), read inside the method the
way `isUtc()` already reads `getZoneDefault()` in `helpers/timezone.ts`.

Callers to update: `packages/activemodel/src/type/time.ts` (self-call in the
`super` tail), `packages/activemodel/src/type/helpers/time-value.ts`, and the
`TimeValue` interface's declaration of the method.

## Acceptance criteria

- [ ] `userInputInTimeZone` takes `value` only, in both `type/time.ts` and
      `helpers/time-value.ts`, and the `TimeValue` interface matches.
- [ ] The zone is read from ActiveSupport's zone state rather than a parameter
      default, with no `"UTC"` literal standing in for `Time.zone`.
- [ ] `packages/activemodel/src/type/time.test.ts`'s three
      `user input in time zone` tests still pass, adjusted to set the ambient
      zone instead of passing one.
