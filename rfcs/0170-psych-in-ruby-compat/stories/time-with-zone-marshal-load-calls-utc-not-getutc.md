---
title: "TimeWithZone#marshalLoad calls Time#utc, not getutc"
status: draft
updated: 2026-10-16
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `TimeWithZone#marshal_load` (`vendor/rails/v8.0.2/activesupport/lib/active_support/time_with_zone.rb:533-535`) is
`initialize(variables[0].utc, ::Time.find_zone(variables[1]), variables[2].utc)`.

trails `packages/activesupport/src/time-with-zone.ts` `marshalLoad` calls `variables[0].getutc()` / `variables[2].getutc()`
where Rails calls `Time#utc`, which `@blazetrails/date` ports at `packages/date/src/time.ts:1630` (`getutc` is `:1648`).
Ruby `Time#utc` converts the receiver in place and returns it; `getutc` returns a copy. The loaded `Time`s are fresh, so the
difference is unobservable, but the call name is not Rails'. Surfaced in review of trails#8973.

## Acceptance criteria

- [ ] `marshalLoad` calls `utc()` on both variables, matching `time_with_zone.rb:534`.
- [ ] The `time with zone` marshal tests stay green; `parity:api:calls` shows no new row.
