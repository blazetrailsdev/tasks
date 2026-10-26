---
title: "tzdata-tables-generated-from-nodes-tzdata-release"
status: in-progress
updated: 2026-10-26
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9344
claim: "2026-10-26T18:30:29Z"
assignee: "time-strftime-ports-rb-strftime"
blocked-by: null
closed-reason: null
---

## Context

`scripts/generate-tzdata-isdst.ts` (`RUBY_SCRIPT`, `:41-70`) and
`scripts/generate-tzdata-abbreviations.ts` (`:39`) build the committed
`TZDATA_ISDST` / `TZDATA_BASE_OFFSETS` / `TZDATA_ABBREVIATIONS` tables
(`packages/date/src/tzdata-isdst.ts`, `tzdata-abbreviations.ts`) by running Ruby
tzinfo against the host's `/usr/share/zoneinfo`. The port reads offsets from
Node's ICU (`Temporal` / `Intl`) at run time. On this host those are two tzdata
releases: the host is 2026c, while Node 24.16's `process.versions.tz` is 2026b.
They also differ in how links are built: the host keeps `CET` / `EST` as fixed
zones and has no `Zulu`, while 2026b's `backward` makes `CET` a link to
`Europe/Brussels` and `EST` a link to `America/Panama`.

So the port mixes the two. The fugit-family fuzz (trails#9316,
`scripts/fugit-fuzz/`, which now gives Ruby a zoneinfo compiled from Node's
release) shows, at seed 20261025 on the eo surface:

- `"203-10-06 CET"`: the offset matches (`+00:17:30`), and `%Z` is `LMT` in
  Ruby but `CET` in the port. The same goes for `"180-02-26 19:51:23 EST"`
  (`-05:18:08`, `LMT` against `EST`).
- `"2026-03-31T22:05:52.116835 Africa/Casablanca"`: Ruby says
  `dst:false`, the port `dst:true`. `"2036-12-18T15:56:15.942307 Africa/Casablanca"`
  is the same, and its abbreviation is `+01` in Ruby against `+00` in the port.

## Acceptance criteria

- The generators read a zoneinfo compiled from the IANA release Node carries
  (`process.versions.tz`), as `zoneinfo()` in `scripts/fugit-fuzz/fuzz.ts` does,
  not the host's. The regenerated tables are committed, and each generator test
  still reproduces them.
- The release a table was generated from is recorded beside it, and a test fails
  when it differs from `process.versions.tz`, so a Node upgrade cannot leave the
  tables stale without anyone noticing.
- The fuzz's `eo: [4]` / `eo: [5]` groups above are gone
  (`TZ=UTC pnpm tsx scripts/fugit-fuzz/fuzz.ts --seed 20261025 --count 2000 --surface eo`).
