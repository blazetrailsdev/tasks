---
title: "fugit-fuzz reads the rearguard zoneinfo from scripts/tzdata-zoneinfo.ts"
status: draft
updated: 2026-10-26
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
closed-reason: null
---

## Context

trails#9344 added `scripts/tzdata-zoneinfo.ts`. Its `zoneinfo()` compiles the
IANA release named by `process.versions.tz` from its **rearguard** form
(`make rearguard.zi`, then `zic`). ICU, and so `Temporal`, builds from rearguard
too, which has no negative DST. The fugit-family fuzz
(`scripts/fugit-fuzz/fuzz.ts` `zoneinfo()`, trails#9316) compiles the
**main** sources instead. Under main, `Africa/Casablanca` and `Europe/Dublin`
read DST inverted. At seed 20261025, that alone produces the `eo: [5]`
Casablanca case (`dst:false` in Ruby, `dst:true` in the port). The case goes
away when the fuzz's Ruby side reads the rearguard zoneinfo (checked locally).

## Acceptance criteria

- `scripts/fugit-fuzz/fuzz.ts` drops its own `zoneinfo()` and sets
  `FUGIT_FUZZ_ZONEINFO` from `zoneinfo()` in `scripts/tzdata-zoneinfo.ts`.
- `TZ=UTC pnpm tsx scripts/fugit-fuzz/fuzz.ts --seed 20261025 --count 2000 --surface eo`
  has no Casablanca `dst` case.
- The same run has no `2040-06-28 ... CET` case (fixed in the readers by
  `tzdata-tables-past-horizon-year-2040`).
