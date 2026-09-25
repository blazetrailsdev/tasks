---
title: "TimeZone abbreviation: answer tzdata's, not Intl's short name"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`packages/activesupport/src/values/time-zone.ts` `getZoneInfo` reads the zone
abbreviation from `Intl.DateTimeFormat(..., { timeZoneName: "short" })`.
TZInfo (`TimezonePeriod#abbreviation`, reached by `TimeWithZone#zone`,
`activesupport/lib/active_support/time_with_zone.rb:127-129`) answers the tzdata
abbreviation. Intl differs from it: ICU folds tzdata's `Etc/GMT` links onto
`Etc/UTC` and reports "UTC", and it reports `Etc/GMT+5` as "GMT-5" where tzdata
says "-05". trails#8085 patched only the `Etc/GMT` links, with a private
`ETC_GMT_LINKS` set, so that `utc?` (`time_with_zone.rb:105-107`,
`zone == "UTC" || zone == "UCT"`) stays correct.

`packages/date/src/time.ts` already answers tzdata abbreviations for
`Time#zone` through `tzdataAbbreviation` (`ZONE_ABBREVIATIONS` +
`tzdataIsdst`, trails#6076).

## Acceptance criteria

- `getZoneInfo`'s abbreviation (so `Timezone#abbr` / `periodForUtc`) uses the
  same tzdata abbreviation source as `@blazetrails/date`'s `Time#zone`.
- `ETC_GMT_LINKS` is deleted.
- A trails test pins `Etc/GMT+5` → "-05" and `Etc/GMT` → "GMT", matching TZInfo.
