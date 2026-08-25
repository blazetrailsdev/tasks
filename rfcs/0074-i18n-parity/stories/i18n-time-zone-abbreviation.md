---
title: "Time#zone: answer the tzdata abbreviation, not Intl's short name (~90 LOC)"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6076
claim: "2026-08-04T17:19:58Z"
assignee: "i18n-time-zone-abbreviation"
blocked-by: null
closed-reason: null
---

## Context

`Time#zone` in `packages/i18n/src/time.ts` reads the zone abbreviation off
`Intl.DateTimeFormat(..., { timeZoneName: "short" })`, which is not the tzdata
abbreviation MRI answers for every zone. It agrees for the zones that have an
English abbreviation (`"UTC"`, `"EST"`, `"PDT"`) and diverges for the ones that
do not: `Asia/Kolkata` gives `"GMT+5:30"` where MRI gives `"IST"`, and
`Australia/Adelaide` gives `"GMT+10:30"` where MRI gives `"ACDT"`.

This only reaches a caller through `%Z` on a local-zone `Time` — a
`Time.utc` answers `"UTC"` and an offset-built time answers `nil` — and Rails
i18n uses the receiver's `strftime` result verbatim
(`i18n/lib/i18n/backend/base.rb:91-92`), so the wrong abbreviation would print
straight into a localized string.

trails/Rails anchors: `packages/i18n/src/time.ts` (`get zone()`), MRI
`Time#zone` (tzdata `%Z`), and the localization path at
`i18n/lib/i18n/backend/base.rb:91-92`.

## Converged shape

Answer the tzdata abbreviation. `Intl` exposes it for some zones through
`timeZoneName: "shortGeneric"` / `"long"` but not reliably; the settled option
is a small abbreviation table keyed by zone id and offset on the i18n side
(`packages/i18n` cannot import `packages/activesupport`, so it cannot borrow
`values/time-zone.ts`), or a documented `@noRailsEquivalent` narrowing if the
platform genuinely cannot supply it.

## Acceptance criteria

- `new Time(...).zone` answers the tzdata abbreviation for a zone whose
  `Intl` short name is a `GMT+HH:MM` string (`Asia/Kolkata` → `"IST"`).
- `Time.utc(...).zone` stays `"UTC"` and an offset-built time stays `null`.
- The localization tests are unchanged.
