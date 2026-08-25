---
title: "user_input_in_time_zone substitutes UTC where Ruby answers a zoneless to_time"
status: done
updated: 2026-08-07
rfc: "0088-date-gem-port"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6189
claim: "2026-08-07T17:53:00Z"
assignee: "user-input-in-time-zone-utc-fallback-is-not-rails-zoneless-arm"
blocked-by: null
closed-reason: null
---

## Context

`user_input_in_time_zone` is `value.in_time_zone` (`vendor/rails/activemodel/
lib/active_model/type/helpers/time_value.rb:42-44`), and `in_time_zone` with no
zone set takes its else arm
(`vendor/rails/activesupport/lib/active_support/core_ext/date_and_time/zones.rb:20-27`):

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

So with `Time.zone` unset Ruby answers a **zoneless** value — a bare `to_time` —
not a UTC-anchored one. trails substitutes UTC in two places, both added/kept by
PR #6180 when the invented `zone` parameter was removed:

- `packages/activemodel/src/type/helpers/time-value.ts` — `getZone()?.tzinfo ?? "UTC"`
- `packages/activemodel/src/type/time.ts` — same expression in the `super(value)` tail

The substitution is forced by the return type: both methods are declared
`Temporal.ZonedDateTime | null`, and a `ZonedDateTime` cannot represent "no zone
attached". It is cited at both call sites rather than hidden, and it matches the
pre-existing convention `isUtc()` already applies to an unset `zone_default`
(`packages/activemodel/src/type/helpers/timezone.ts`) — but it is still a
deviation, not a language shortcoming that has been fully worked around.

Reviewed twice on #6180 and marked "justified, not blocking"; filed here so the
justification does not quietly become permanent.

## Converged shape

The zoneless arm is representable — `Temporal.PlainDateTime` is the analogue of
a `::Time` with no zone attached — so the honest signature is a union that can
carry it, e.g. `Temporal.ZonedDateTime | Temporal.PlainDateTime | null`, with
the UTC substitution deleted. Whether the callers
(`attribute-methods/time-zone-conversion.ts`, the PG `array`/`range` delegates)
can absorb the wider return type is the actual work; if they cannot, that is the
finding to record, with the specific caller named.

Check `isUtc()`'s unset-`zone_default` default (`helpers/timezone.ts`) at the
same time — it is the same substitution one layer down, and Rails'
`Helpers::Timezone#is_utc?` reads `Time.zone_default` directly.

## Acceptance criteria

- [ ] With no `Time.zone` and no `zone_default` set, `userInputInTimeZone`
      answers a zoneless value rather than one anchored to UTC, matching
      `zones.rb:20-27`.
- [ ] The `?? "UTC"` literal is gone from both `type/time.ts` and
      `type/helpers/time-value.ts`.
- [ ] A test covers the unset-zone path in both.
- [ ] If a caller genuinely cannot absorb the zoneless value, the story is
      blocked with that caller named, not closed by re-justifying the fallback.
