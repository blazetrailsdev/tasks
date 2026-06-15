---
title: "MessagePack ext types 5-8,10 DateTime/Date/Time/TimeWithZone/Duration (nanosecond-faithful temporal reps)"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails registers ext types **5 DateTime, 6 Date, 7 Time, 8 TimeWithZone, 10
Duration** in `ActiveSupport::MessagePack::Extensions`
(`vendor/rails/activesupport/lib/active_support/message_pack/extensions.rb:45-72`),
with nanosecond-faithful component encodings:

```ruby
registry.register_type 5, DateTime, ...   # extensions.rb:45 — jd + h/m/s + rational fraction + offset
registry.register_type 6, Date, ...       # :50 — Julian day number
registry.register_type 7, Time, ...       # :55 — at_without_coercion(sec, subsec_nanos, :nanosecond, in: offset)
registry.register_type 8, ActiveSupport::TimeWithZone, ...   # :60 — read_time + read_time_zone
registry.register_type 10, ActiveSupport::Duration, ...      # :69 — PARTS.zip
```

(Unpack helpers: `read_rational`/`read_time`/`read_time_zone` at
`extensions.rb:149,167,176,197-204`.)

trails' registry (`packages/activesupport/src/message-pack/extensions.ts:89-152`)
registers `9` (TimeZone) but **none of 5/6/7/8/10**. trails has the building
blocks — `Temporal`-based date/time types (used in the quoting layer:
`Temporal.Instant`/`PlainDate`/`PlainDateTime`/`ZonedDateTime` per
`connection-adapters/abstract/quoting.ts`) and an
`ActiveSupport::Duration` (`packages/activesupport/src/duration.ts`) — so the
work is mapping each Rails component encoding onto the trails temporal reps with
**nanosecond fidelity** (the `subsec_nanos` / rational-fraction precision is the
crux; a lossy `Date`-based seconds encoding would not round-trip Ruby's
nanosecond `Time`).

## Acceptance criteria

- [ ] Register ext types **5, 6, 7, 8, 10** in `message-pack/extensions.ts`,
      each mirroring the Rails component layout (`extensions.rb:45-72` +
      unpack helpers at `:149/:167/:176/:197`), mapped onto the trails
      `Temporal`/`Duration` reps.
- [ ] Nanosecond precision is preserved end-to-end (a Ruby `Time` with non-zero
      `nsec` round-trips byte-for-byte); time-zone identity is preserved for
      type 8.
- [ ] Round-trip tests for each type, including a DST/offset case for
      TimeWithZone and a multi-part Duration; cross-runtime compatible with Ruby.
- [ ] If nanosecond-faithful `Time` (type 7) requires reworking the underlying
      temporal rep beyond this story's ≤500 LOC budget, land 5/6/10 first and
      register a follow-up for 7/8; do not fan out PRs.
- [ ] api:compare / test:compare delta non-negative.
