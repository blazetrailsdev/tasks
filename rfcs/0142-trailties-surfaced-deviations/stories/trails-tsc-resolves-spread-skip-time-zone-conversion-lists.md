---
title: "trails-tsc resolves spread/computed skipTimeZoneConversionForAttributes lists"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10464 made trails-tsc read `skipTimeZoneConversionForAttributes` (`packages/activerecord-cli/lib/type-virtualization/walker.ts`, `readStaticValue`; `synthesize.ts`, `skipTimeZoneConversionForAttributes`). It reads only an array literal of string literals. A list built any other way, such as `[...Parent.skipTimeZoneConversionForAttributes, "x"]`, `.concat(...)` or a const reference, counts as undeclared, so those columns are typed `TimeWithZone` while Rails holds a naive `Time` at runtime (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:74-80`, `create_time_zone_conversion_attribute?`). Rails applications commonly write `self.skip_time_zone_conversion_for_attributes += [:x]`.

## Acceptance criteria

- The walker resolves a spread of the parent's list plus string literals (and `this.x = [...this.x, "y"]` in a static block) against the ancestor chain.
- A shape it cannot resolve is flagged, as `dynamicTableName` is, rather than read silently as "nothing skipped".
- A virtualize test covers the spread shape.
