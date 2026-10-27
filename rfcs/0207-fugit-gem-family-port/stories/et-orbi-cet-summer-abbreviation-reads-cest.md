---
title: "et-orbi strftime %Z answers CEST for a summer CET instant (fuzz seed 20261025)"
status: closed
updated: 2026-10-27
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: fixed in trails#9316 (4f1b260e83), not a separate story"
---

## Context

`TZ=UTC pnpm tsx scripts/fugit-fuzz/fuzz.ts --seed 20261025 --count 2000 --surface eo`
(trails#9316, after the fuzz moved to the shared rearguard zoneinfo) reports one
divergence on `EtOrbi.parse("2040-06-28 13:19:26 CET")`: the `strftime` `%Z` field
reads `CEST` in Ruby (et-orbi over tzinfo, `vendor/et-orbi/.../et-orbi/time.rb`
`#strftime` → `TZInfo::TimezonePeriod#abbreviation`) and `CET` in the port. Offset
(+02:00) and `dst:true` agree, so only the abbreviation lookup for a summer instant
in a zone named by its winter abbreviation differs (likely the far-future 2040
period, past the last explicit transition, in the port's abbreviation table).

## Acceptance criteria

- The port's `%Z` for that input answers `CEST`, matching et-orbi/tzinfo.
- A regression test in the et-orbi port covers it.
- The fuzz command above reports no `eo` abbreviation divergence.
