---
title: "activesupport: to_fs has no receiver dispatch; Time#to_fs carries two invented arms and quoting re-derives them"
status: in-progress
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8742
claim: "2026-10-10T02:09:38Z"
assignee: "enum-private-enum-body-is-a-line-for-line-port"
blocked-by: null
closed-reason: null
---

## Context

Left by trails#8726, which gave `formatForInspect` Rails' single date/time arm.

Ruby dispatches `value.to_fs(:inspect)` on the receiver's class: `Date#to_fs`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date/conversions.rb:49-59`),
`Time#to_fs` (`core_ext/time/conversions.rb:55-61`) and `TimeWithZone#to_fs`
(`time_with_zone.rb:212-220`). trails spells the first two as free functions, so nothing
dispatches. Three residues:

- `packages/activesupport/src/core-ext/time/conversions.ts` `toFs` now opens with two arms
  `Time#to_fs` does not have: `if (date instanceof TimeWithZone) return date.toFs(format)` and
  `if (date instanceof Temporal.PlainDate) return dateToFs(date, format)`. They carry no
  `@inventedArm` receipt because the free function has no skeleton row against `Time#to_fs`
  (`call-skeletons.json` has no `time/conversions` pair), and `parity:api:arms:throws` reds on a
  receipt with no row. The body also still bridges a JS `Date` and a `Temporal.Instant` to a
  `RubyTime`.
- `packages/activerecord/src/connection-adapters/abstract/quoting.ts:295-302` has a private
  `toFs(value, format)` that re-derives the same receiver dispatch (TimeWithZone, PlainDate,
  ZonedDateTime / PlainDateTime, Time) for `quoted_date`
  (`activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:124-140`).
- `packages/activerecord/src/attribute-methods.ts` `formatForInspect` tests
  `value instanceof Temporal.PlainDate || value instanceof RubyTime || value instanceof Temporal.Instant`
  where Rails tests `value.is_a?(Date) || value.is_a?(Time)`
  (`activerecord/lib/active_record/attribute_methods.rb:533`). The third clause exists because a
  time cast can still answer a `Temporal.Instant`
  (`packages/activemodel/src/type/helpers/time-value.ts:60-64`,
  `packages/activemodel/src/type/time.ts:41`). It reports as `+or` in the arms report's
  short-circuit projection.

## Acceptance criteria

- [ ] One `to_fs` receiver dispatch exists for Date / Time / TimeWithZone values, and
      `Time#to_fs`'s port has no arm `time/conversions.rb:55-61` lacks.
- [ ] `abstract/quoting.ts` has no private `toFs` helper; `quotedDate` calls the same dispatch.
- [ ] `formatForInspect`'s date/time test has two clauses, as `attribute_methods.rb:533`, which
      needs time casts to stop answering a bare `Temporal.Instant` (or `Time`'s `instanceof` to
      answer one).
- [ ] `time-ext.trails.test.ts` "toFs dispatches on the receiver" stays green.
