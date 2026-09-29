---
title: "Port TimeObjectSerializer, DateSerializer, DateTimeSerializer, TimeSerializer and TimeWithZoneSerializer"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob", "date", "activesupport"]
deps: ["port-activejob-arguments"]
deps-rfc: []
est-loc: 300
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Five `ObjectSerializer` subclasses under `vendor/rails/v8.0.2/activejob/lib/active_job/serializers/`:

- `time_object_serializer.rb`: abstract base with `NANO_PRECISION = 9`,
  `serialize` storing `time.iso8601(NANO_PRECISION)` (`:5-10`).
- `date_serializer.rb`: `date.iso8601` / `Date.iso8601` (`:6-12`).
- `date_time_serializer.rb` < `TimeObjectSerializer`: `DateTime.iso8601` (`:6-8`).
- `time_serializer.rb` < `TimeObjectSerializer`: `Time.iso8601` (`:6-8`).
- `time_with_zone_serializer.rb`: its own `NANO_PRECISION = 9`, stores
  `"value" => iso8601(9)` and `"time_zone" => time_zone.tzinfo.name`
  (`:8-13`); `deserialize` is
  `Time.iso8601(hash["value"]).in_time_zone(hash["time_zone"] || Time.zone)`
  (`:15-17`).

`Date`, `DateTime` and `Time` are `@blazetrails/date`'s
(`packages/date/src/date.ts:4468,5805`, `packages/date/src/time.ts:400`);
`TimeWithZone` is activesupport's.

## Fidelity traps (predicted at authoring)

- [ ] **Nanoseconds.** `iso8601(9)` needs sub-millisecond precision; confirm `@blazetrails/date`'s `Time#iso8601(9)` and `Time.iso8601` keep nine digits, and file the gap against that package if they do not.
- [ ] **Class order matters.** `serialize?` is `is_a?(klass)`, and `DateTime` is a `Date` subclass in Ruby: `serializers.rb:62-63` registers `DateTimeSerializer` before `DateSerializer` so a `DateTime` is not caught as a `Date`. Keep that order and prove it with a test.
- [ ] **`hash["time_zone"] || Time.zone`** is Ruby `||` on a String: an empty string would be kept. Use `??` (nil-only), not JS `||`.
- [ ] **`tzinfo.name`** is the IANA identifier, not the Rails zone name.

## Acceptance criteria

- [ ] All five files read complete in `parity:api`.
- [ ] `Time.new(2002, 10, 31, 2, 2, 2.123456789r, "+02:00")` and a `TimeWithZone` at `"59.123456789"` seconds round-trip with all nine fractional digits (the data list at `argument_serialization_test.rb:51-77`).

## Definition of done

Serializing through JS `Date#toISOString` (millisecond precision) does not close this story.
