---
title: "Port the five unported TimeZone members outside the Period seam"
status: done
updated: 2026-08-18
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6726
claim: "2026-08-18T21:06:56Z"
assignee: "converge-references-eager-loaded-tables-symbol-to-s"
blocked-by: null
closed-reason: null
---

## Context

Five members of `vendor/rails/activesupport/lib/active_support/values/time_zone.rb`
have no counterpart in `packages/activesupport/src/values/time-zone.ts`. They
are the last genuinely-unported members of that file and are **not** part of the
`TimeWithZone`/`Period` seam that `time-with-zone-residue-structural-blockers`
is blocked on — that story owns `period_for_local`, `periods_for_local`,
`utc_to_local`, `local_to_utc` and `find_tzinfo`. These five are separable.

| Ruby                                        | line | body                                                                                       | dependency                 |
| ------------------------------------------- | ---- | ------------------------------------------------------------------------------------------ | -------------------------- |
| `zones_map` (private, class)                | 287  | memoizes `MAPPING.each_with_object` over `self[name]`                                      | none — self-contained      |
| `time_now` (private)                        | 610  | `Time.now`                                                                                 | none                       |
| `abbr(time)` (public, `:nodoc:`)            | 567  | `tzinfo.abbr(time)`                                                                        | the tzinfo object's `abbr` |
| `load_country_zones(code)` (private, class) | 273  | `TZInfo::Country.get(code)`, `zone_identifiers`, `create(...)`                             | `TZInfo::Country` surface  |
| `parts_to_time(parts, now)` (private)       | 585  | raises `ArgumentError "invalid date"` on nil, returns on empty, `Time.at(parts[:seconds])` | **`Time.at`**              |

`parts_to_time` is coupled to a gap this RFC already knows about:
`time-helpers-stub-date-and-datetime-clock` records that `@blazetrails/date`'s
`Time` has no `at` constructor (`packages/date/src/time.ts:239-331` exposes
`now`/`utc`/`mktime` only). Either port `Time.at` there first or sequence
`parts_to_time` behind it.

Measured 2026-08-18: the AR-closure rollup reads **8917/8943 (99.7%)**; these
five are 5 of the 26-method gap.

## Acceptance criteria

- [ ] `zonesMap` and `timeNow` are ported — private, Rails names, Rails bodies.
- [ ] `abbr` is ported and routes through the tzinfo object rather than
      re-deriving an abbreviation; if trails' tzinfo shim has no `abbr`, the
      shim grows it rather than the caller inlining a lookup.
- [ ] `loadCountryZones` is ported, or blocked with the specific missing
      `TZInfo::Country` surface named (not "TZInfo is incomplete").
- [ ] `partsToTime` is ported with Rails' guards in order — `ArgumentError`
      `"invalid date"` on nil, early return on empty — or is split out and
      sequenced behind porting `Time.at` into `@blazetrails/date`, with that
      dependency recorded.
- [ ] `pnpm parity:api` AR-closure rollup rises by the number ported.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; no new
      baseline rows.
