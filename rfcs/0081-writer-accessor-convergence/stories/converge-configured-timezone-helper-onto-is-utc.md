---
title: "Converge configuredTimezone() onto Rails' is_utc? branching"
status: claimed
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-27T14:53:06Z"
assignee: "converge-configured-timezone-helper-onto-is-utc"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/type/helpers/timezone.ts` exports
`configuredTimezone(utc = isUtc())`, a trails-only helper with no Rails
counterpart — `pnpm api:extra` reports it as the file's only novel export.
Rails has no zone-name resolver: `TimeValue#new_time` and
`#fast_string_to_time`
(`vendor/rails/activemodel/lib/active_model/type/helpers/time_value.rb:51-60`,
`:91-94`) branch directly on `is_utc?` and call `::Time.utc` vs `::Time.local`.

Trails needs _some_ zone identifier because Temporal has no `Time.local`
analogue, but the helper currently leaks into activerecord as well
(`packages/activerecord/src/attribute-methods/time-zone-conversion.ts` imports
it from `@blazetrails/activemodel` and threads a `subtypeIsUtc` flag through
three call sites, added in #5402).

## Acceptance criteria

- Either fold the zone resolution into the `is_utc?` branch at each Rails call
  site so `configuredTimezone` stops being exported surface, or justify it at
  the call site as an unavoidable Temporal-shaped deviation.
- `packages/activerecord/src/attribute-methods/time-zone-conversion.ts` stops
  importing `configuredTimezone` across the package boundary.
- `pnpm api:extra` shows one fewer activemodel novel export, or the remaining
  one carries an inline justification.
