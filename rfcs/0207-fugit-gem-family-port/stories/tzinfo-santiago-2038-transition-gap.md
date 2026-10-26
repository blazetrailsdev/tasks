---
title: "tzinfo-santiago-2038-transition-gap"
status: draft
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

For `America/Santiago`, Ruby tzinfo 2.0.6 with a slim zoneinfo (`zic`'s default,
compiled from tzdata 2026b) has no September 2038 transition.
`transitions_up_to(Time.utc(2040), Time.utc(2037))` lists
`2037-04-05 -4`, `2037-09-06 -3`, `2038-01-19 03:14:07 -3` (the 32-bit cut-off),
`2038-04-04 -4`, `2039-04-03 -4`, `2039-09-04 -3`. So
`EtOrbi.parse("2039-01-03T04:15 America/Santiago")` is `-04:00` in Ruby and
`-03:00` in the port, which reads `Temporal`. With a fat zoneinfo, Ruby gives `-4`
too.

The fugit-family fuzz (trails#9316) shows this as the single `eo: [0]` case at
seed 20261025. It is probably tzinfo's `ZoneinfoReader` generating rule
transitions from the year after the last explicit one (`zoneinfo_reader.rb`,
around `:206`), so a southern-hemisphere zone loses its spring-forward in that
year. Confirm that before changing anything.

## Acceptance criteria

- The cause is pinned to a tzinfo 2.0.6 `file:line`.
- Then either the port matches Ruby's answer for zones hit by the same gap (if
  this is tzinfo behaviour every Ruby app on a zoneinfo data source sees), or the
  story closes `FALSIFIED:` with the evidence that Ruby's answer depends on
  something the port need not mirror.
- A regression test with Ruby's value, if the port changes.
