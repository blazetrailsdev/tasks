---
title: "Time and Date seats inspect by time_inspect, not JS toString"
status: draft
updated: 2026-10-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`inspectValue` (`packages/ruby-compat/src/object.ts`) answers a JS `Date` or a Temporal value (the seats of Ruby `Time`, `Date` and `DateTime`, per `rbObjClass`'s boundary note) through `rbObjAsString`, its JS `toString()`, e.g. `Wed Dec 31 1969 19:00:00 GMT-0500`. MRI's `Time#inspect` is `time_inspect` (`vendor/ruby/v3.3.11/time.c:4379-4415`): `%Y-%m-%d %H:%M:%S`, subseconds with trailing zeros trimmed, then `UTC` or a `+HHMM` offset after a space. `Date#inspect` / `DateTime#inspect` come from the date gem (`#<Date: 2026-10-18 ((2461332j,0s,0n),+0s,2299161j)>`). trails#9026 kept the `toString` arm only for these seats, so it would not regress them into the `rb_obj_inspect` ivar form.

## Acceptance criteria

- `rbInspect(new Date(...))` and a Temporal instant answer `time_inspect`'s format; a `Temporal.PlainDate` / `PlainDateTime` answers the date gem's `inspect`.
- The `value instanceof Date || temporalTag(value) !== null` → `rbObjAsString` arm in `inspectValue` is removed.
- Tests cover UTC, a non-zero offset, and a subsecond value.
