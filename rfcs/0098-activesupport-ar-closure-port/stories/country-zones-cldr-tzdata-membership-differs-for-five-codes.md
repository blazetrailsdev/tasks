---
title: "countryZones answers a shorter list than Rails for AQ/AU/RU/TF/VN (CLDR vs zone1970.tab membership)"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6457
claim: "2026-08-13T03:56:51Z"
assignee: "call-args-ar-select-async-kwarg"
blocked-by: null
closed-reason: null
---

## Context

`country-zones-intl-reports-link-names-tzinfo-reports-canonical` (PR #6276)
closed the tzdata LINK-vs-canonical half of the `TimeZone.countryZones` gap by
resolving each identifier `Intl.Locale#getTimeZones` reports through a
`CANONICAL_ZONE_IDENTIFIERS` table before the `MAPPING.value?` test in
`load_country_zones` (`activesupport/lib/active_support/values/time_zone.rb:275-284`).

That took agreement with `TZInfo::Country#zone_identifiers` from 128 to
**244 of 249** country codes. Five remain, and they are a DIFFERENT mechanism:
ECMA-402's country table (CLDR) and tzdata's `zone1970.tab` genuinely disagree
about which zones belong to a country, so no link resolution can reconcile them.

Measured on ruby 3.3.11 / tzinfo vs node 24 (`want` = TZInfo, `got` = trails):

| code | TZInfo has, trails lacks | trails has, TZInfo lacks                |
| ---- | ------------------------ | --------------------------------------- |
| `AQ` | `Asia/Singapore`         | — (`Antarctica/Vostok` stands unlinked) |
| `AU` | `Asia/Tokyo`             | —                                       |
| `RU` | `Europe/Simferopol`      | —                                       |
| `TF` | `Asia/Dubai`             | —                                       |
| `VN` | `Asia/Bangkok`           | —                                       |

Every one is a MISSING member on the trails side, so `countryZones` for those
five answers a SHORTER list than Rails. `au` and `ru` are both codes Rails
tests (`time_zone_test.rb:851-857`), and those tests still pass because they
use `assert_includes` on zones that ARE present — the gap is invisible to them.

## Converged shape

The five entries are stable tzdata facts, not runtime variation, so the cheapest
convergence is a second small table beside `CANONICAL_ZONE_IDENTIFIERS` —
per-country membership additions, generated the same way and carried for the
same reason (the runtime exposes no `zone1970.tab`). Confirm each entry against
`TZInfo::Country.get(code).zone_identifiers` before adding it, and regenerate
both tables together.

Worth checking first whether a newer ICU/node closes any of the five on its own;
if so, the table shrinks rather than grows.

## Acceptance criteria

- [ ] `countryZones` agrees with `TZInfo::Country#zone_identifiers` for all 249
      codes, or every remaining exception is enumerated with its reason.
- [ ] A test pins at least `au` and `ru` by full membership, not `toContain`.
- [ ] `test_country_zones` and its three siblings still pass.
