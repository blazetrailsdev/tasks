---
title: "trails-tsc types columns in skip_time_zone_conversion_for_attributes as naive Time"
status: draft
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9355 made trails-tsc type a `datetime` / `time` column from the app's
`time_zone_aware_attributes` (`loadTimeZoneAwareAttributes`,
`packages/activerecord-cli/src/tsc-wrapper/cli.ts`). It does not read a model's
`skip_time_zone_conversion_for_attributes`, which Rails checks per attribute in
`create_time_zone_conversion_attribute?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:74-80`).
A model that skips conversion for a column is typed `TimeWithZone` but holds a `Time`.

## Acceptance criteria

- The walker records a literal `skipTimeZoneConversionForAttributes` array on a model
  (static assignment or `this.` in a static block), and `synthesize.ts` types those
  columns with `tsTypeFor(type, false)`.
- A virtualize test covers a skipped column next to a converted one.
