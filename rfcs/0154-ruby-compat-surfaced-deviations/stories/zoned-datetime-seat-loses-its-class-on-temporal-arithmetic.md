---
title: "date: a value derived from a zoned DateTime seat reads as Time again"
status: draft
updated: 2026-10-13
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8853 made a zoned `DateTime` seat read as a `DateTime`: `DateTime#toDatetime`
(`packages/date/src/date.ts`) defines a non-enumerable `rubyClass` = `"DateTime"` on the
`Temporal.ZonedDateTime` (or `SubMinuteOffsetZonedDateTime`) it returns, and `rbObjClass`
(`packages/ruby-compat/src/object.ts`, the `hasEpochNanoseconds` arm) reads that brand to answer
`rbCDateTime` where an unbranded zoned value is `rbCTime`.

The brand is an own property of one object. A value derived from the seat through Temporal's own
methods (`zoned.add(...)`, `.subtract(...)`, `.with(...)`, `.withPlainTime(...)`, `.round(...)`,
`.startOfDay()`, `.withTimeZone(...)`) is a fresh `Temporal.ZonedDateTime` with no brand, so
`rbObjClass` answers `Time` for it and `rbObjIsKindOf(derived, rbCDateTime)` is false. MRI's
`DateTime#+` / `#>>` / `#new_offset` answer a `DateTime`
(`vendor/ruby/v3.3.11/ext/date/date_core.c`, `d_lite_plus` and `dup_obj_with_new_offset` both
build from `rb_obj_class(self)`), and activesupport's `DateTime#advance` / `#change`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date_time/calculations.rb:51-87`)
rely on that.

`SubMinuteOffsetZonedDateTime` already rebuilds itself from the six derived methods it overrides
(`date.ts`, the `for (const name of ["add", "subtract", "with", "withPlainTime", "round",
"startOfDay"])` loop), which is the shape a `DateTime` seat class would take.

## Acceptance criteria

- [ ] A value derived from a zoned `DateTime` seat by Temporal arithmetic is still a `DateTime`
      under `rbObjClass` and `rbObjIsKindOf(_, rbCDateTime)`, and is not `rbCTime`.
- [ ] A `Temporal.ZonedDateTime` that no `DateTime` built still reads as `Time`.
- [ ] `packages/date/src/date.trails.test.ts` asserts both on `add`, `with` and `withTimeZone`.
