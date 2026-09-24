---
title: "date-in-time-zone-return-type-includes-time"
status: in-progress
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8058
claim: "2026-09-24T21:02:32Z"
assignee: "inline-bound-value-and-join-plan-helpers"
blocked-by: null
closed-reason: null
---

## Context

trails#7830 made `Date#to_time` (`packages/activesupport/src/core-ext/date/conversions.ts`) return a Ruby `Time`, per `activesupport/lib/active_support/core_ext/date/conversions.rb:83-86`. With no `Time.zone` set, `in_time_zone` on a Date therefore answers `Time` (`core_ext/date_and_time/zones.rb:27`), but the TS declarations still say `TimeWithZone`:

- `packages/activesupport/src/core-ext/date-and-time/zones.ts` — the `inTimeZone(dateOrTime: Temporal.PlainDate, ...)` overload.
- `packages/activesupport/src/core-ext/date/calculations.ts` — `ago`, `since`, `beginningOfDay`, `middleOfDay`, `endOfDay`, `plusWithDuration`, `minusWithDuration` (`core_ext/date/calculations.rb:55-86`).

Widening them to `TimeWithZone | Time` cascades into `date-and-time/calculations.ts:152,157`, `testing/time-helpers.ts:146-178`, `date-ext.test.ts` (`.timeZone`) and `time-with-zone.test.ts` (`.inspect()`), so it was left out of #7830.

## Acceptance criteria

- The overload and the date calculation return types above declare `TimeWithZone | Time`, and every caller type-checks without casts that hide the `Time` arm.
- `pnpm typecheck` is green.
