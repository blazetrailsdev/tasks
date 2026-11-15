---
title: "CountryTimezone#timezone calls Timezone.get_proxy"
status: done
updated: 2026-11-15
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps:
  - tzinfo-timezone-subclasses
deps-rfc: []
est-loc: 15
priority: null
pr: trails#10132
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/tzinfo/v2.0.6/lib/tzinfo/country_timezone.rb:20` `CountryTimezone#timezone` is
`Timezone.get_proxy(@identifier)`. `packages/tzinfo/lib/country-timezone.ts` `timezone()`
calls `Timezone.get(this.identifier)` instead, because `TimezoneProxy` and
`Timezone.get_proxy` are unported (`tzinfo-timezone-subclasses`). The call gate
reported a `@missingRailsCall get_proxy` receipt as stale, so the call site carries no
receipt (trails#10091). `Country#zones` (`country.rb`, `zone_info.map(&:timezone)`)
inherits the deviation.

## Acceptance criteria

- [ ] `CountryTimezone#timezone` calls `Timezone.getProxy(this.identifier)`.
- [ ] `country-timezone.test.ts` "timezone" and `country.test.ts` "zones" assert
      `toBeInstanceOf(TimezoneProxy)`, as `tc_country_timezone.rb` / `tc_country.rb` do.
