---
title: "Converge TimeZoneConverter is_utc? fallback onto ActiveRecord.default_timezone"
status: claimed
updated: 2026-07-29
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-29T02:15:44Z"
assignee: "converge-tz-converter-fallback-onto-ar-default-timezone"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/attribute-methods/time-zone-conversion.ts`'s
`zoneForIsUtc(subtypeIsUtc)` falls back to `isUtcTimezone()` from
`@blazetrails/activemodel` when the wrapped subtype exposes no `isUtc`
(`resolveIsUtc` returns undefined). Since #5402 that helper derives from
`Time.zone_default`, not from `ActiveRecord.default_timezone`.

In Rails the types wrapped by `TimeZoneConverter` are AR types, whose
`is_utc?` comes from `ActiveRecord::Type::Internal::Timezone`
(`activerecord/lib/active_record/type/internal/timezone.rb:9-15`), which
reads `ActiveRecord.default_timezone` — a different source from ActiveModel's
`Time.zone_default`-derived `is_utc?`
(`activemodel/lib/active_model/type/helpers/timezone.rb:9-13`). trails already
has that AR reader as `isUtc()` / `getDefaultTimezone()` in
`packages/activerecord/src/type/internal/timezone.ts`.

The two agree in the default test setup (both UTC), so no test currently
distinguishes them; they diverge when `ActiveRecord.default_timezone = :local`
while `Time.zone_default` stays UTC (or vice versa).

## Acceptance criteria

- `zoneForIsUtc`'s fallback reads AR's `Internal::Timezone` `isUtc()` rather
  than ActiveModel's, matching which `is_utc?` Rails would resolve for an AR
  type.
- A regression test sets `ActiveRecord.default_timezone = "local"` with
  `Time.zone_default` left at UTC and asserts the converter's PlainDateTime /
  multiparameter path interprets components in the host zone; it must fail on
  the pre-fix baseline.
- No cross-package import of ActiveModel's timezone helper remains in
  `time-zone-conversion.ts` unless justified at the call site.
