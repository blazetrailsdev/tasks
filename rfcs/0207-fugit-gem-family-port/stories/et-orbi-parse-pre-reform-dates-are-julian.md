---
title: "et-orbi parse of a pre-1582 date reads DateTime's Julian fields as Gregorian"
status: ready
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Differential fuzz (`scripts/fugit-fuzz`, seed 20261025, ~90 inputs): `EtOrbi.parse("196-05-25")` is `0196-05-24 12:00:00 Z` in Ruby and `0196-05-25` in the port. `EtOrbi.parse` (`vendor/et-orbi/v1.2.11/lib/et-orbi/make.rb:28-46`) builds a `DateTime.parse(str)`, which is Julian before the ITALY reform, then `zone.local_to_utc(dt).to_time` moves it to the proleptic-Gregorian Time. The port's `Timezone#localToUtc` (`packages/tzinfo/src/index.ts`) reads the `Temporal.PlainDateTime` fields as Gregorian, so every pre-1582-10-15 date is off by the Julian/Gregorian gap.

## Acceptance criteria

- [ ] `EtOrbi.parse` of a pre-reform date answers Ruby's instant (`196-05-25` → -55969531200, `988-09-08`, `993-06-01` → -30817527060).
- [ ] Regression cases in an et-orbi trails test, values from Ruby 3.3.11.
