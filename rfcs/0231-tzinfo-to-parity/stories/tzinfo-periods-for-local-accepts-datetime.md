---
title: "tzinfo-periods-for-local-accepts-datetime"
status: draft
updated: 2026-11-21
rfc: "0231-tzinfo-to-parity"
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

Rails' `TimeWithZone#change` (`vendor/rails/v8.0.2/activesupport/lib/active_support/time_with_zone.rb:395-404`) calls `new_time.utc_offset` and `new_zone.periods_for_local(new_time)` with no type check. TZInfo takes a Time or a DateTime through `Timestamp.for`. trails' `TimeZone#periodsForLocal` (`packages/activesupport/lib/values/time-zone.ts:559`) and tzinfo's `Timezone#periodsForLocal` (`packages/tzinfo/lib/timezone.ts:577`, through `ignoringOffset`) take only a `Time`. So `change` in `packages/activesupport/lib/time-with-zone.ts` branches on `instanceof DateTime`, converting with `_transferTimeValuesToUtcConstructor` and reading `utcOffset` through the date-time core-ext. Those branches are receipted `@inventedArm if — CONVERGEABLE` with this story.

## Acceptance criteria

- tzinfo's `periodsForLocal` / `periodForLocal`, and ActiveSupport `TimeZone`'s wrappers, accept `Time | DateTime` the way `Timestamp.for` does.
- `TimeWithZone#change` drops its `instanceof DateTime` arms and its receipt.
