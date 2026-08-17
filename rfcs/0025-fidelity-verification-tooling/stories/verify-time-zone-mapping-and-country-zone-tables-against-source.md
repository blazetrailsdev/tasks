---
title: "Nothing checks TimeZone's MAPPING against vendored Rails, or the zone tables against tzdata"
status: draft
updated: 2026-08-13
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/values/time-zone.ts` carries three literal tables
that must track a source outside the repo, and nothing checks any of them:

- `MAPPING` — a transcription of
  `activesupport/lib/active_support/values/time_zone.rb:33-185`.
- `CANONICAL_ZONE_IDENTIFIERS` — tzdata backward links, added by PR #6276.
- `COUNTRY_ZONE_IDENTIFIER_ADDITIONS` — `zone1970.tab` membership CLDR omits,
  added by PR #6457.

`MAPPING` had silently drifted from the vendored Rails source. A throwaway
script written while closing
`country-zones-cldr-tzdata-membership-differs-for-five-codes` compared the two
key-for-key and found FOUR divergences, all invisible to the suite:

| key             | vendored Rails        | trails (before #6457) |
| --------------- | --------------------- | --------------------- |
| `"Puerto Rico"` | `America/Puerto_Rico` | **absent**            |
| `"Solomon Is."` | `Pacific/Guadalcanal` | keyed `Solomon`       |
| `Astana`        | `Asia/Almaty`         | `Asia/Dhaka`          |
| `Canberra`      | `Australia/Canberra`  | `Australia/Melbourne` |

The missing `"Puerto Rico"` row alone made `countryZones` disagree with
`TZInfo::Country#zone_identifiers` for 19 of 249 country codes. `MAPPING` order
matters too — `load_country_zones` (`time_zone.rb:283-296`) emits Rails names in
MAPPING order for a zone with several keys.

These tables are exactly the kind of hand-carried data that rots: `MAPPING`
against a `pnpm vendor:fetch`, the other two against a node/ICU or tzdata bump.
The story that added the third table notes "worth checking first whether a newer
ICU closes any of the five on its own" — there is no way to answer that today
short of writing the script again.

## Converged shape

A checked-in parity check, run in CI, that:

1. Parses `MAPPING = {` out of
   `vendor/rails/activesupport/lib/active_support/values/time_zone.rb` and
   asserts the TS `MAPPING` matches key-for-key, value-for-value AND in order.
   This one is a pure vendored-source comparison and should be a hard gate.
2. Compares `TimeZone.countryZones(code)` against
   `TZInfo::Country.get(code).zone_identifiers` run through that same MAPPING,
   for all 249 codes, reporting any code where the two disagree — so an ICU or
   tzdata bump surfaces as a diff on the two runtime-gap tables rather than as
   silently wrong output. Needs `ruby`/`tzinfo`, which are on PATH for the
   parity tooling; gate or report-only per what CI can rely on.

Both were run ad hoc while closing #6457 and both were green at merge, so the
check lands on a passing baseline.

## Acceptance criteria

1. A `parity:*` check asserts the TS `MAPPING` equals vendored Rails' by key,
   value and order, and fails on drift.
2. `countryZones` agreement with `TZInfo::Country#zone_identifiers` across all
   249 codes is verified by a checked-in script rather than an ad hoc one.
3. Both are wired into CI, green on the current tree.

## Re-verified 2026-08-17 (draft sweep)

Still valid — `packages/activesupport/src/values/time-zone.ts` still carries all
three literal tables and nothing checks any of them against
`activesupport/lib/active_support/values/time_zone.rb` or tzdata.
