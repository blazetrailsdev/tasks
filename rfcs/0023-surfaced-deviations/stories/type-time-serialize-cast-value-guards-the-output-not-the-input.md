---
title: "Type::Time#serializeCastValue guards on its output type, nulling a value Rails wraps"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Type::Time#serialize_cast_value` is
(`activerecord/lib/active_record/type/time.rb:18-20`):

    def serialize_cast_value(value) # :nodoc:
      Value.new(super) if value
    end

The guard is on the INPUT — any non-nil value is wrapped, whatever `super`
answers. trails inverted it to a type test on the OUTPUT
(`packages/activerecord/src/type/time.ts:69-73`):

    const serialized = super.serializeCastValue(value);
    return serialized instanceof Temporal.Instant ? new Value(serialized) : null;

so a value `super` answers as anything but a `Temporal.Instant` is silently
turned into `null` where Rails wraps it. #7101 made that reachable: with the
`TimeZoneConverter` pre-walk gone, a zone-aware `time` attribute now hands the
subtype a `TimeWithZone` (Rails does the same — `TimeWithZone#is_a?(::Time)` is
true, so Ruby's `case value when ::Time` at `time.rb:11-16` wraps it), and
trails would answer `null` instead of a bind value.

`Type::Time#serialize`'s sibling divergence belongs with it: Rails is
`case value = super; when ::Time then Value.new(value); else value` (`:11-16`),
while the port delegates to `super.serialize` and relies on the base routing
through `serializeCastValue`, so the `else` arm has no seat.

Not reached today only because `time_zone_aware_types` has to include `:time`
for the converter to wrap a `Type::Time`; it is a latent null-bind, not a
theoretical one.

## Converged shape

- `serializeCastValue` guards on the input: `value != null ? new Value(superResult) : null`.
- `serialize` mirrors the `case ... when ::Time` shape rather than deferring to
  the base's cast-value routing.
- A test covers a `TimeWithZone` reaching `Type::Time#serializeCastValue`.

## Acceptance criteria

- [ ] `serializeCastValue` wraps whatever `super` answers for a non-nil input.
- [ ] A `TimeWithZone` through a zone-aware `time` attribute serializes to a
      `Type::Time::Value`, not `null`.
- [ ] `type/time.test.ts` and the AR time suites stay green on all three adapters.
