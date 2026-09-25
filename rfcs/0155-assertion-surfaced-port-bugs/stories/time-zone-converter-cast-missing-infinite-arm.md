---
title: "time-zone-converter-cast-missing-infinite-arm"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8089
claim: "2026-09-25T15:11:37Z"
assignee: "schema-dumper-cases-dump-a-hand-built-schema-source"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `adapters/postgresql/infinity_test.rb` assertions in
trails#7904 (story `assertions-postgresql-adapter-tail`).

Rails' `TimeZoneConverter#cast`
(`activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:17-32`)
has four arms:

```ruby
if value.is_a?(Hash)              then set_time_zone_without_conversion(super)
elsif value.respond_to?(:in_time_zone) then ...
elsif value.respond_to?(:infinite?) && value.infinite? then value   # :28-29
else map(super) { |v| cast(v) }
end
```

trails' port (`packages/activerecord/src/attribute-methods/time-zone-conversion.ts:52-77`)
is missing the third arm entirely. It has `isInfinite` (`:97-105`) and uses it in
`convertTimeToTimeZone` (`:88`, the port of `:43-44`), but `cast` falls straight
through to `this.map(super.cast(value), …)`.

Today the observable result happens to agree for the values
`infinity_test.rb` exercises, because `super.cast` returns a non-Time numeric
unchanged and `map` passes it through — which is why
`assigning 'infinity' on a datetime column with TZ aware attributes` passes on
trails#7904 without the arm. The gap is a dropped branch, not (yet) a wrong
answer, and it is invisible to `parity:api:calls` because the call set is
unchanged.

## Acceptance criteria

- [ ] `TimeZoneConverter#cast` in
      `packages/activerecord/src/attribute-methods/time-zone-conversion.ts`
      grows the `isInfinite(value)` arm returning `value`, in Rails' branch
      order (after the `in_time_zone` arm, before the `map` fallback), mirroring
      `time_zone_conversion.rb:28-29`.
- [ ] A regression test covers a value that reaches the new arm and would take
      the `map` fallback without it — it must fail on the baseline.
- [ ] `adapters/postgresql/infinity_test.rb` stays at 0 assertion-count,
      -kind and -value mismatches.
