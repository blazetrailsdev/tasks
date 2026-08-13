---
title: "TimeZoneConverter#cast splits the in_time_zone arm and never calls user_input_in_time_zone"
status: draft
updated: 2026-08-13
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TimeZoneConverter#cast`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:17-32`)
has exactly four arms:

```ruby
return if value.nil?
if value.is_a?(Hash)                       then set_time_zone_without_conversion(super)
elsif value.respond_to?(:in_time_zone)     then (super(user_input_in_time_zone(value)) || super rescue ArgumentError -> nil)
elsif value.respond_to?(:infinite?) && value.infinite? then value
else                                            map(super) { |v| cast(v) }
end
```

trails (`packages/activerecord/src/attribute-methods/time-zone-conversion.ts:49-98`, as of PR #6485)
splits the `respond_to?(:in_time_zone)` arm into four TS-typed arms
(`TimeWithZone`, `Temporal.ZonedDateTime`, `Temporal.Instant`,
`Temporal.PlainDateTime`) plus a bespoke `parseStringInZone` for the String
case, and never calls the delegated `userInputInTimeZone` at all. It is also
missing the `infinite?` arm and the `rescue ArgumentError -> nil` guard.

This is the reason behind the remaining RFC 0047 call-set baseline row
`attribute-methods/time-zone-conversion.ts` `cast` -> `user_input_in_time_zone`
(`scripts/api-compare/call-mismatches-exclude/activerecord/attribute-methods/time-zone-conversion.json`).

`userInputInTimeZone` exists on the subtype chain already — `OID::Range` and
`OID::Array` both delegate it (`oid/range.rb:9`, `oid/array.rb:13`), and
`ActiveRecord::Type::Internal::Timezone#user_input_in_time_zone` is ported.

## Converged shape

One `respond_to?(:in_time_zone)` arm — a single predicate over the value types
that carry a zone conversion (TimeWithZone / Instant / ZonedDateTime /
PlainDateTime / string) — whose body is
`this._subtype.cast(this.userInputInTimeZone(value)) ?? this._subtype.cast(value)`
with the ArgumentError -> null rescue, followed by the `infinite?` arm and then
the existing `map(super) { |v| cast(v) }` else-branch. `parseStringInZone` and
the per-type arms collapse into `userInputInTimeZone`.

## Acceptance criteria

1. `cast` has Rails' four arms, in Rails' order, including `infinite?` and the
   ArgumentError rescue.
2. `cast` calls the delegated `userInputInTimeZone`; `parseStringInZone` is deleted.
3. The `cast` -> `user_input_in_time_zone` call-set baseline row is deleted
   (only-shrink, no `--write`).
4. `attribute-methods/time-zone-conversion.test.ts`, `multiparameter-attributes`,
   and the PG `range`/`array`/`timestamp` suites stay green.
