---
title: "TimeZone.us_zones is a hardcoded list instead of country_zones(:us)"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6250
claim: "2026-08-08T17:40:02Z"
assignee: "date-constructor-is-proleptic-gregorian-not-italy"
blocked-by: null
closed-reason: null
---

## Context

`TimeZone.usZones` (`packages/activesupport/src/values/time-zone.ts`) returns a
hardcoded list of 12 US zone names. Rails is
`def us_zones; country_zones(:us); end`
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:252-254`),
and `country_zones` (`:258-262`) memoizes `load_country_zones(code)`, which
selects from `TZInfo::Country.get(code).zone_identifiers` (`:283-296`) — so the
membership comes from the TZInfo database, not from a literal in the port.

The literal list means a zone Rails would include (or drop) on a tzdata update
diverges silently, and `countryZones` for any other code has no port at all.

Surfaced by PR #6234, which had to write `TimeZone.find(n)!` over that literal
list.

## Converged shape

`usZones` delegates to `countryZones("us")`; `countryZones` resolves its zone
identifiers from the runtime's IANA data (`Intl.supportedValuesOf("timeZone")`
plus the country mapping) and memoizes per code, mirroring `@country_zones`.

## Acceptance criteria

- [ ] `usZones` is `countryZones("us")` — no literal name list.
- [ ] `countryZones` exists, memoizes per code, and mirrors
      `load_country_zones`'s select-then-sort.
- [ ] Rails' `test_us_zones` / `test_country_zones` pass.
