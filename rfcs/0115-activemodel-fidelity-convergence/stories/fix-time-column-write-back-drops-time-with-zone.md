---
title: "fix-time-column-write-back-drops-time-with-zone"
status: draft
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AttributeMethodsTest#setting a time zone-aware time with DST`
(`vendor/rails/activerecord/test/cases/attribute_methods_test.rb:889-901`) is
ported in `packages/activerecord/src/attribute-methods.test.ts` but skipped
`BLOCKED`, because it fails on a real trails gap rather than on the port.

```ruby
in_time_zone "Pacific Time (US & Canada)" do
  current_time = Time.zone.local(2014, 06, 15, 10)
  record = @target.new(bonus_time: current_time)
  time_before_save = record.bonus_time

  record.save
  record.reload

  assert_equal time_before_save, record.bonus_time
  assert_equal ActiveSupport::TimeZone["Pacific Time (US & Canada)"], record.bonus_time.time_zone
end
```

Measured on the port: `record.bonus_time` is a `TimeWithZone` immediately
before `save()` and `null` immediately after it — before any `reload()`, and
with the persisted row also holding no value. So saving a record whose
time-zone-aware `time` attribute holds a `TimeWithZone` clears the in-memory
attribute.

The value reaches the attribute through
`TimeZoneConverter.cast` (`packages/activerecord/src/attribute-methods/time-zone-conversion.ts:67-69`),
which converts it correctly; the loss happens on the write path —
`TimeZoneConverter.serialize` / `serializeCastValue` delegate to
`TimeType` (`packages/activemodel/src/type/time.ts`), whose `castValue`
non-string branch is `applySecondsPrecision(value)`
(`packages/activemodel/src/type/helpers/time-value.ts:33`) and returns the
`TimeWithZone` unchanged, which the `time` column's quoting/write-back then
drops. Rails has no such loss: `Type::Time#cast_value`'s
`apply_seconds_precision` arm (`activemodel/lib/active_model/type/time.rb`)
takes a `TimeWithZone` because every Ruby time-like is a `Time`.

## Acceptance criteria

- [ ] Saving a record whose tz-aware `time` attribute holds a `TimeWithZone`
      keeps the in-memory value and persists it.
- [ ] `setting a time zone-aware time with DST` is un-skipped and asserts what
      `attribute_methods_test.rb:889-901` asserts, on all three lanes.
- [ ] `pnpm parity:test:assertions` delta non-negative.
