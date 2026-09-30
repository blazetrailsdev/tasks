---
title: "trails-tsc-datetime-columns-type-as-an-instant-plaindatetime-union"
status: ready
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Under `trails-tsc`, `post.created_at` is `Instant | PlainDateTime`, so every caller
narrows before formatting or comparing. Which one Rails yields depends on
`time_zone_aware_attributes`, which the Rails railtie defaults to `true`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:85`), and on
`time_zone_aware_types`
(`activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb`). The
application config decides it. For a given app it's one type, not a union.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Converged shape

`trails-tsc` resolves a `datetime` / `timestamp` column's type from the app's
effective `time_zone_aware_attributes` / `time_zone_aware_types`, or from the
model's `skip_time_zone_conversion_for_attributes`. It emits the single type the
attribute will actually hold, and falls back to the union only when the config
can't be determined statically.

## Acceptance criteria

- [ ] In a default scaffolded app, `post.created_at` is typed as the zone-aware type alone.
- [ ] An app that disables `time_zone_aware_attributes` gets the plain type. Type tests cover both.
