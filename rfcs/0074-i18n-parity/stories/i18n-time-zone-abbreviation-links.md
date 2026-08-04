---
title: "Time#zone: resolve tzdata link names before the abbreviation lookup"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6082
claim: "2026-08-04T18:04:58Z"
assignee: "i18n-time-zone-abbreviation-links"
blocked-by: null
closed-reason: null
---

## Context

`ZONE_ABBREVIATIONS` in `packages/i18n/src/time.ts` (added by #6076) is keyed by
tzdata _primary_ zone id, and `tzdataAbbreviation` looks the receiver's
`timeZoneId` up in it verbatim. tzdata link names resolve to the same zone but
miss the table: a host whose local zone is `Asia/Calcutta` (the link) rather
than `Asia/Kolkata` falls through to the numeric fallback and answers `"+0530"`
where MRI answers `"IST"`. `Temporal.Now.timeZoneId()` returns whatever the
platform reports, and both spellings are in the wild (`US/Pacific`,
`Australia/Canberra`, `Asia/Saigon`, `Europe/Kiev` are the same class of miss).

This reaches a caller through `%Z` on a local-zone `Time`, and
`I18n::Backend::Base#localize` (i18n/lib/i18n/backend/base.rb:91-92) uses the
receiver's `strftime` result verbatim, so the wrong abbreviation prints into a
localized string — the same failure #6076 fixed, on the link spelling.

trails anchor: `packages/i18n/src/time.ts` (`ZONE_ABBREVIATIONS`,
`tzdataAbbreviation`). There is no Rails source: the class carries
`@noRailsEquivalent PERMANENT` (Rails never defines `::Time`, only reopens it in
`core_ext/time/*.rb`), so the target is MRI's tzdata answer, not a Rails body.

## Converged shape

Resolve the link before the lookup rather than widening the table with one row
per alias. `Intl.DateTimeFormat(..., { timeZone: id }).resolvedOptions().timeZone`
canonicalizes a link to its primary id on every runtime trails supports, so
`tzdataAbbreviation` can key off that instead of the raw `timeZoneId`.

## Acceptance criteria

- A local zone given by its tzdata link name answers the primary zone's
  abbreviation (`Asia/Calcutta` → `"IST"`, `US/Pacific` → `"PST"`/`"PDT"`).
- The primary-name and numeric-fallback cases from #6076 are unchanged.
